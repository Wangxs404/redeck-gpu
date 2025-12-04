"""
异步任务队列系统
支持 GPU OCR 任务的并发处理和状态追踪
"""

import asyncio
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, Optional, Any, Callable
from collections import deque
import logging

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    PENDING = "pending"      # 等待处理
    PROCESSING = "processing"  # 正在处理
    COMPLETED = "completed"   # 处理完成
    FAILED = "failed"        # 处理失败


@dataclass
class Task:
    task_id: str
    task_type: str
    params: Dict[str, Any]
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "task_type": self.task_type,
            "status": self.status.value,
            "result": self.result,
            "error": self.error,
            "created_at": datetime.fromtimestamp(self.created_at).isoformat(),
            "started_at": datetime.fromtimestamp(self.started_at).isoformat() if self.started_at else None,
            "completed_at": datetime.fromtimestamp(self.completed_at).isoformat() if self.completed_at else None,
            "wait_time_seconds": round(self.started_at - self.created_at, 2) if self.started_at else None,
            "process_time_seconds": round(self.completed_at - self.started_at, 2) if self.completed_at and self.started_at else None,
        }


class TaskQueue:
    """异步任务队列，支持多 worker 并发处理"""
    
    def __init__(self, max_workers: int = 3, max_queue_size: int = 100):
        self.max_workers = max_workers
        self.max_queue_size = max_queue_size
        self.queue: asyncio.Queue = None
        self.tasks: Dict[str, Task] = {}
        self.workers: list = []
        self.handlers: Dict[str, Callable] = {}
        self.running = False
        self.stats = {
            "total_submitted": 0,
            "total_completed": 0,
            "total_failed": 0,
        }
        # 保留最近完成的任务结果（避免内存无限增长）
        self.max_completed_tasks = 1000
        self.completed_task_ids = deque(maxlen=self.max_completed_tasks)
    
    def register_handler(self, task_type: str, handler: Callable):
        """注册任务处理函数"""
        self.handlers[task_type] = handler
        logger.info(f"[TaskQueue] 注册处理器: {task_type}")
    
    async def start(self):
        """启动任务队列和 workers"""
        if self.running:
            return
        
        self.queue = asyncio.Queue(maxsize=self.max_queue_size)
        self.running = True
        
        # 启动 worker
        for i in range(self.max_workers):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.workers.append(worker)
        
        logger.info(f"[TaskQueue] 启动完成: {self.max_workers} workers, 队列容量 {self.max_queue_size}")
    
    async def stop(self):
        """停止任务队列"""
        self.running = False
        
        # 取消所有 worker
        for worker in self.workers:
            worker.cancel()
        
        # 等待 worker 结束
        await asyncio.gather(*self.workers, return_exceptions=True)
        self.workers.clear()
        
        logger.info("[TaskQueue] 已停止")
    
    async def submit(self, task_id: str, task_type: str, params: Dict[str, Any]) -> Task:
        """提交任务到队列"""
        if not self.running:
            raise RuntimeError("任务队列未启动")
        
        if task_type not in self.handlers:
            raise ValueError(f"未知的任务类型: {task_type}")
        
        if self.queue.full():
            raise RuntimeError(f"队列已满 (最大 {self.max_queue_size})")
        
        task = Task(
            task_id=task_id,
            task_type=task_type,
            params=params,
        )
        
        self.tasks[task_id] = task
        await self.queue.put(task)
        self.stats["total_submitted"] += 1
        
        logger.info(f"[TaskQueue] 任务已提交: {task_id}, 队列长度: {self.queue.qsize()}")
        
        return task
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """获取任务状态"""
        return self.tasks.get(task_id)
    
    def get_queue_status(self) -> Dict[str, Any]:
        """获取队列状态"""
        pending_count = sum(1 for t in self.tasks.values() if t.status == TaskStatus.PENDING)
        processing_count = sum(1 for t in self.tasks.values() if t.status == TaskStatus.PROCESSING)
        
        return {
            "running": self.running,
            "max_workers": self.max_workers,
            "active_workers": processing_count,
            "queue_size": self.queue.qsize() if self.queue else 0,
            "max_queue_size": self.max_queue_size,
            "pending_tasks": pending_count,
            "processing_tasks": processing_count,
            "stats": self.stats,
        }
    
    async def _worker(self, worker_name: str):
        """Worker 协程，持续处理队列中的任务"""
        logger.info(f"[{worker_name}] 启动")
        
        while self.running:
            try:
                # 等待任务，超时后继续循环检查 running 状态
                try:
                    task = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                
                # 处理任务
                task.status = TaskStatus.PROCESSING
                task.started_at = time.time()
                logger.info(f"[{worker_name}] 开始处理: {task.task_id}")
                
                try:
                    handler = self.handlers[task.task_type]
                    result = await handler(task.params)
                    
                    task.status = TaskStatus.COMPLETED
                    task.result = result
                    task.completed_at = time.time()
                    self.stats["total_completed"] += 1
                    
                    logger.info(f"[{worker_name}] 完成: {task.task_id}, 耗时: {task.completed_at - task.started_at:.2f}s")
                    
                except Exception as e:
                    task.status = TaskStatus.FAILED
                    task.error = str(e)
                    task.completed_at = time.time()
                    self.stats["total_failed"] += 1
                    
                    logger.error(f"[{worker_name}] 失败: {task.task_id}, 错误: {e}")
                
                finally:
                    self.queue.task_done()
                    # 记录已完成的任务 ID
                    self.completed_task_ids.append(task.task_id)
                    # 清理过期任务
                    self._cleanup_old_tasks()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[{worker_name}] Worker 异常: {e}")
        
        logger.info(f"[{worker_name}] 已停止")
    
    def _cleanup_old_tasks(self):
        """清理过期的已完成任务，避免内存泄漏"""
        if len(self.tasks) > self.max_completed_tasks * 2:
            # 只保留最近的已完成任务
            to_remove = []
            for task_id, task in self.tasks.items():
                if task.status in (TaskStatus.COMPLETED, TaskStatus.FAILED):
                    if task_id not in self.completed_task_ids:
                        to_remove.append(task_id)
            
            for task_id in to_remove:
                del self.tasks[task_id]
            
            if to_remove:
                logger.info(f"[TaskQueue] 清理 {len(to_remove)} 个过期任务")


# 全局任务队列实例
task_queue = TaskQueue(max_workers=3, max_queue_size=100)
