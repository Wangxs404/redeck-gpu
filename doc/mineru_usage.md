[Skip to content](https://opendatalab.github.io/MinerU/usage/quick_usage/#using-mineru)

# Using MinerU

## Quick Model Source Configuration

MinerU uses `huggingface` as the default model source. If users cannot access `huggingface` due to network restrictions, they can conveniently switch the model source to `modelscope` through environment variables:

```
export MINERU_MODEL_SOURCE=modelscope
```

For more information about model source configuration and custom local model paths, please refer to the [Model Source Documentation](https://opendatalab.github.io/MinerU/usage/model_source/) in the documentation.

## Quick Usage via Command Line

MinerU has built-in command line tools that allow users to quickly use MinerU for PDF parsing through the command line:

```
# Default parsing using pipeline backend
mineru -p <input_path> -o <output_path>
```

Tip

- `<input_path>`: Local PDF/image file or directory
- `<output_path>`: Output directory

For more information about output files, please refer to [Output File Documentation](https://opendatalab.github.io/MinerU/reference/output_files/).

Note

The command line tool will automatically attempt cuda/mps acceleration on Linux and macOS systems.
Windows users who need cuda acceleration should visit the [PyTorch official website](https://pytorch.org/get-started/locally/) to select the appropriate command for their cuda version to install acceleration-enabled `torch` and `torchvision`.

```
# Or specify vlm backend for parsing
mineru -p <input_path> -o <output_path> -b vlm-transformers
```

Tip

The vlm backend additionally supports `vllm`/`lmdeploy` acceleration. Compared to the `transformers` backend, inference speed can be significantly improved. You can check the installation method for the complete package supporting `vllm`/`lmdeploy` acceleration in the [Extension Modules Installation Guide](https://opendatalab.github.io/MinerU/quick_start/extension_modules/).

If you need to adjust parsing options through custom parameters, you can also check the more detailed [Command Line Tools Usage Instructions](https://opendatalab.github.io/MinerU/usage/cli_tools/) in the documentation.

## Advanced Usage via API, WebUI, http-client/server

- Direct Python API calls: [Python Usage Example](https://github.com/opendatalab/MinerU/blob/master/demo/demo.py)
- FastAPI calls:



```
mineru-api --host 0.0.0.0 --port 8000
```





Tip



Access `http://127.0.0.1:8000/docs` in your browser to view the API documentation.

- Start Gradio WebUI visual frontend:




```
# Using pipeline/vlm-transformers/vlm-http-client backends
mineru-gradio --server-name 0.0.0.0 --server-port 7860
# Or using vlm-vllm-engine/pipeline backends (requires vllm environment)
mineru-gradio --server-name 0.0.0.0 --server-port 7860 --enable-vllm-engine true
# Or using vlm-lmdeploy-engine/pipeline backends (requires lmdeploy environment)
mineru-gradio --server-name 0.0.0.0 --server-port 7860 --enable-lmdeploy-engine true
```





Tip



- Access `http://127.0.0.1:7860` in your browser to use the Gradio WebUI.

- Using `http-client/server` method:




```
# Start openai compatible server (requires vllm or lmdeploy environment)
mineru-openai-server
# Or start vllm server (requires vllm environment)
mineru-openai-server --engine vllm --port 30000
# Or start lmdeploy server (requires lmdeploy environment)
mineru-openai-server --engine lmdeploy --server-port 30000
```





Tip



In another terminal, connect to vllm server via http client (only requires CPU and network, no vllm environment needed)






```
mineru -p <input_path> -o <output_path> -b vlm-http-client -u http://127.0.0.1:30000
```


Note

All officially supported `vllm/lmdeploy` parameters can be passed to MinerU through command line arguments, including the following commands: `mineru`, `mineru-openai-server`, `mineru-gradio`, `mineru-api`.
We have compiled some commonly used parameters and usage methods for `vllm/lmdeploy`, which can be found in the documentation [Advanced Command Line Parameters](https://opendatalab.github.io/MinerU/usage/advanced_cli_parameters/).

## Extending MinerU Functionality with Configuration Files

MinerU is now ready to use out of the box, but also supports extending functionality through configuration files. You can edit `mineru.json` file in your user directory to add custom configurations.

Important

The `mineru.json` file will be automatically generated when you use the built-in model download command `mineru-models-download`, or you can create it by copying the [configuration template file](https://github.com/opendatalab/MinerU/blob/master/mineru.template.json) to your user directory and renaming it to `mineru.json`.

Here are some available configuration options:

- `latex-delimiter-config`:
  - Used to configure LaTeX formula delimiters
  - Defaults to `$` symbol, can be modified to other symbols or strings as needed.
- `llm-aided-config`:
  - Used to configure parameters for LLM-assisted title hierarchy
  - Compatible with all LLM models supporting `openai protocol`, defaults to using Alibaba Cloud Bailian's `qwen3-next-80b-a3b-instruct` model.
  - You need to configure your own API key and set `enable` to `true` to enable this feature.
  - If your API provider does not support the `enable_thinking` parameter, please manually remove it.
    - For example, in your configuration file, the `llm-aided-config` section may look like:



      ```
      "llm-aided-config": {
         "api_key": "your_api_key",
         "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
         "model": "qwen3-next-80b-a3b-instruct",
         "enable_thinking": false,
         "enable": false
      }
      ```

    - To remove the `enable_thinking` parameter, simply delete the line containing `"enable_thinking": false`, resulting in:



      ```
      "llm-aided-config": {
         "api_key": "your_api_key",
         "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
         "model": "qwen3-next-80b-a3b-instruct",
         "enable": false
      }
      ```
- `models-dir`:
  - Used to specify local model storage directory
  - Please specify model directories for `pipeline` and `vlm` backends separately.
  - After specifying the directory, you can use local models by configuring the environment variable `export MINERU_MODEL_SOURCE=local`.

Back to top
