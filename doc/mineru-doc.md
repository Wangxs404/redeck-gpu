curl -s -X POST "https://api.firecrawl.dev/v2/scrape" \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://firecrawl.dev",
    "formats": ["markdown", "html"]
  }'

api=fc-fff3360e799d47069aac27cc7be34ef5

urls:
https://github.com/opendatalab/MinerU/blob/master/README.md
https://opendatalab.github.io/MinerU/quick_start/docker_deployment/
https://opendatalab.github.io/MinerU/usage/advanced_cli_parameters/
https://opendatalab.github.io/MinerU/usage/quick_usage/
