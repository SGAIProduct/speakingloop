# SpeakingLook Hackathon Deployment Runbook

这份文档用于比赛当天部署、预热、验收和关停。命令中的 Key、URL 和 Market ID 都必须替换为实际值。

## 1. 发布前检查

```bash
npm ci
npm test
npm run smoke
git status --short
```

验收标准：测试全部通过；仓库中没有 `.env`、API Key、重复项目、生成数据或个人文件。

## 2. 部署 Nosana 推理端点

为了避免评委等待 GPU 冷启动，先部署 Nosana，再部署应用。

1. 登录 Nosana Dashboard，创建 API Key。
2. 在 Explorer/Dashboard 中选择有可用节点且显存足够的 GPU Market。
3. 发布仓库中的 Job：

```bash
npm install -g @nosana/cli
nosana job post \
  --file nosana/ollama.json \
  --market <AVAILABLE_MARKET> \
  --timeout 60
```

4. 保存输出的 Job ID、节点页和服务 URL，作为 README/答辩证据。
5. 等待模型下载完成并检查端点：

```bash
curl --fail --show-error "https://<nosana-service-url>/api/tags"
```

6. 记录实际服务地址，但不要把临时认证信息提交到 Git。

## 3. 配置 Daytona

安装并登录：

```bash
brew install daytonaio/cli/daytona
daytona login --api-key="$DAYTONA_API_KEY"
```

创建沙箱（本次组织实际可用区域为 US）：

```bash
daytona create \
  --name speakinglook-demo \
  --target us \
  --dockerfile Dockerfile \
  --context . \
  --cpu 2 \
  --memory 4096 \
  --disk 10 \
  --auto-stop 60 \
  --auto-archive 60 \
  --public
```

当前 Daytona 文档中 `--memory` 单位是 MB。若旧版 CLI 的帮助信息显示单位为 GB，应把 `4096` 改成 `4`；本次 `v0.190.0` 客户端使用的是 `4`，API 最终确认沙箱内存为 4GB。

在 Daytona 的 Secret/环境变量配置中添加：

```env
HOST=0.0.0.0
PORT=4173
OPENAI_API_KEY=<secret>
ENABLE_QWEN=true
DEFAULT_REPORT_PROVIDER=qwen
DEFAULT_REVIEW_PROVIDER=qwen
DEFAULT_VOCAB_PROVIDER=qwen
OLLAMA_BASE_URL=https://<nosana-service-url>
QWEN_TEXT_MODEL_STANDARD=qwen3:8b
QWEN_TEXT_MODEL_CHEAP=qwen3:8b
```

不要把 Secret 直接拼进截图、README 或公开的 shell 历史。

## 4. 启动与预览

如果 Dockerfile 没有自动启动进程：

```bash
daytona exec speakinglook-demo --cwd /app -- \
  nohup node server.mjs '>' /tmp/speakinglook.log '2>&1' '<' /dev/null '&'
```

精简 Node 镜像默认不包含 `curl`，因此通过公开预览地址检查：

```bash
curl https://<preview-url>/api/health
```

创建六小时评委链接：

```bash
daytona preview-url speakinglook-demo --port 4173 --expires 21600
```

## 5. 比赛当天验收

按顺序完成：

1. 用无痕浏览器打开预览地址。
2. 检查首页、Practice、Assets、Review、Weekly。
3. 麦克风录制并完成一次转录。
4. 完成一次纠正与复述。
5. 保存一个表达并在 Assets 中找到它。
6. 在 Weekly 生成 AI Review。
7. 确认结果显示 `qwen`、模型名和 latency。
8. 重新加载页面，确认服务仍然可用。
9. 准备一段文字输入作为麦克风或网络失败时的备用路径。

## 6. 答辩证据

准备三张不包含密钥的截图：

1. Daytona 沙箱详情和健康状态。
2. Nosana Job/节点页和运行中的 Ollama 服务。
3. SpeakingLook Weekly 页面中的 Qwen Review 结果。

README 中补充：公开 GitHub 地址、Daytona 预览地址、Nosana Job/Explorer 地址和 60 秒演示 GIF。

## 7. 关停

答辩结束后立即停止资源：

```bash
daytona stop speakinglook-demo
daytona archive speakinglook-demo
```

同时在 Nosana Dashboard 停止 GPU Job，确认不再继续消耗额度。
