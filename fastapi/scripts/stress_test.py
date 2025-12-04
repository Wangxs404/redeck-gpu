#!/usr/bin/env python3
"""
GPU OCR 任务队列压力测试脚本
"""

import asyncio
import aiohttp
import time
import json
from datetime import datetime
from dataclasses import dataclass
from typing import List

# 测试配置
API_BASE_URL = "http://localhost:8000"
TEST_IMAGE_URL = "https://pub-cfdf311d8811487aa3ef005ae33a724f.r2.dev/uploads/p2.png"


@dataclass
class TaskResult:
    task_id: str
    submit_time: float
    complete_time: float = 0
    status: str = "pending"
    success: bool = False
    error: str = None
    download_url: str = None
    wait_time: float = 0
    process_time: float = 0


async def submit_task(session: aiohttp.ClientSession, task_num: int) -> TaskResult:
    """提交一个任务"""
    submit_time = time.time()
    
    try:
        async with session.post(
            f"{API_BASE_URL}/tasks/submit",
            json={"file_url": TEST_IMAGE_URL, "model": "google/gemini-2.5-flash"},
            timeout=aiohttp.ClientTimeout(total=10)
        ) as resp:
            data = await resp.json()
            
            if data.get("success"):
                return TaskResult(
                    task_id=data["task_id"],
                    submit_time=submit_time,
                    status="pending"
                )
            else:
                return TaskResult(
                    task_id=f"failed-{task_num}",
                    submit_time=submit_time,
                    status="submit_failed",
                    error=str(data)
                )
    except Exception as e:
        return TaskResult(
            task_id=f"error-{task_num}",
            submit_time=submit_time,
            status="submit_error",
            error=str(e)
        )


async def poll_task(session: aiohttp.ClientSession, result: TaskResult, poll_interval: float = 2.0) -> TaskResult:
    """轮询任务状态直到完成"""
    max_wait = 300  # 最多等待 5 分钟
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            async with session.get(
                f"{API_BASE_URL}/tasks/{result.task_id}",
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                data = await resp.json()
                status = data.get("status")
                
                if status == "completed":
                    result.status = "completed"
                    result.success = True
                    result.complete_time = time.time()
                    result.download_url = data.get("result", {}).get("download_url")
                    result.wait_time = data.get("wait_time_seconds", 0)
                    result.process_time = data.get("process_time_seconds", 0)
                    return result
                
                elif status == "failed":
                    result.status = "failed"
                    result.success = False
                    result.complete_time = time.time()
                    result.error = data.get("error")
                    return result
                
                # 继续轮询
                await asyncio.sleep(poll_interval)
                
        except Exception as e:
            print(f"  [!] 轮询错误 {result.task_id}: {e}")
            await asyncio.sleep(poll_interval)
    
    result.status = "timeout"
    result.error = "轮询超时"
    result.complete_time = time.time()
    return result


async def run_stress_test(num_tasks: int = 10, concurrent_submit: int = 5):
    """运行压力测试"""
    print("=" * 60)
    print(f"  GPU OCR 任务队列压力测试")
    print(f"  时间: {datetime.now().isoformat()}")
    print(f"  任务数: {num_tasks}")
    print(f"  并发提交: {concurrent_submit}")
    print(f"  测试图片: {TEST_IMAGE_URL}")
    print("=" * 60)
    
    results: List[TaskResult] = []
    
    async with aiohttp.ClientSession() as session:
        # 检查服务状态
        print("\n[1] 检查服务状态...")
        async with session.get(f"{API_BASE_URL}/health") as resp:
            health = await resp.json()
            print(f"    队列状态: {health.get('task_queue', {})}")
        
        # 批量提交任务
        print(f"\n[2] 提交 {num_tasks} 个任务...")
        start_submit = time.time()
        
        for batch_start in range(0, num_tasks, concurrent_submit):
            batch_end = min(batch_start + concurrent_submit, num_tasks)
            batch_tasks = [
                submit_task(session, i) 
                for i in range(batch_start, batch_end)
            ]
            batch_results = await asyncio.gather(*batch_tasks)
            results.extend(batch_results)
            
            submitted = len([r for r in results if r.status == "pending"])
            print(f"    已提交: {len(results)}/{num_tasks}, 成功: {submitted}")
        
        submit_duration = time.time() - start_submit
        print(f"    提交完成，耗时: {submit_duration:.2f}s")
        
        # 查看队列状态
        async with session.get(f"{API_BASE_URL}/tasks/queue/status") as resp:
            queue_status = await resp.json()
            print(f"    队列状态: 排队 {queue_status['queue_size']}, 处理中 {queue_status['processing_tasks']}")
        
        # 轮询所有任务
        print(f"\n[3] 等待任务完成...")
        start_wait = time.time()
        
        pending_results = [r for r in results if r.status == "pending"]
        poll_tasks = [poll_task(session, r) for r in pending_results]
        
        completed_results = await asyncio.gather(*poll_tasks)
        
        # 更新结果
        for completed in completed_results:
            for i, r in enumerate(results):
                if r.task_id == completed.task_id:
                    results[i] = completed
                    break
        
        total_duration = time.time() - start_wait
        
    # 统计结果
    print("\n" + "=" * 60)
    print("  测试结果统计")
    print("=" * 60)
    
    success_count = len([r for r in results if r.success])
    failed_count = len([r for r in results if r.status == "failed"])
    error_count = len([r for r in results if "error" in r.status])
    timeout_count = len([r for r in results if r.status == "timeout"])
    
    print(f"\n  任务统计:")
    print(f"    - 总数: {num_tasks}")
    print(f"    - 成功: {success_count}")
    print(f"    - 失败: {failed_count}")
    print(f"    - 错误: {error_count}")
    print(f"    - 超时: {timeout_count}")
    print(f"    - 成功率: {success_count/num_tasks*100:.1f}%")
    
    # 计算时间统计
    successful = [r for r in results if r.success]
    if successful:
        total_times = [r.complete_time - r.submit_time for r in successful]
        wait_times = [r.wait_time for r in successful if r.wait_time]
        process_times = [r.process_time for r in successful if r.process_time]
        
        print(f"\n  时间统计 (成功任务):")
        print(f"    - 总耗时: {total_duration:.2f}s")
        print(f"    - 平均端到端: {sum(total_times)/len(total_times):.2f}s")
        print(f"    - 最短端到端: {min(total_times):.2f}s")
        print(f"    - 最长端到端: {max(total_times):.2f}s")
        
        if wait_times:
            print(f"    - 平均等待: {sum(wait_times)/len(wait_times):.2f}s")
        if process_times:
            print(f"    - 平均处理: {sum(process_times)/len(process_times):.2f}s")
        
        # 吞吐量
        throughput = success_count / total_duration
        print(f"\n  性能指标:")
        print(f"    - 吞吐量: {throughput:.2f} 任务/秒")
        print(f"    - 等效 QPS: {throughput:.2f}")
    
    # 错误详情
    errors = [r for r in results if r.error]
    if errors:
        print(f"\n  错误详情:")
        for r in errors[:5]:  # 只显示前5个
            print(f"    - {r.task_id}: {r.error[:100]}")
    
    # 下载链接示例
    if successful:
        print(f"\n  成功任务示例:")
        for r in successful[:3]:
            print(f"    - {r.download_url}")
    
    print("\n" + "=" * 60)
    
    return {
        "total": num_tasks,
        "success": success_count,
        "failed": failed_count,
        "error": error_count,
        "timeout": timeout_count,
        "total_duration": total_duration,
        "throughput": success_count / total_duration if total_duration > 0 else 0,
    }


if __name__ == "__main__":
    import sys
    
    num_tasks = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    concurrent = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    
    result = asyncio.run(run_stress_test(num_tasks, concurrent))
    print(f"\n最终结果: {json.dumps(result, indent=2)}")
