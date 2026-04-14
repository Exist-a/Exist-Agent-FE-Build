# Exist-Agent-FE-Build - API 对接文档

本文档用于指导其他 AI Agent 或系统与 Exist-Agent-FE-Build 项目进行对接。

## 项目概述

Exist-Agent-FE-Build 是一个基于 AI Agent 的前端代码生成项目，支持两种工作流程：

1. **Traditional 流程**：基于用户文本描述生成 React TypeScript 应用
2. **Figma 直连流程**：基于 Figma 设计稿 URL 生成 React TypeScript 应用

## 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript + Tailwind CSS + Ant Design X
- **后端**: Express 4 + LangGraph + LangChain
- **存储**: 阿里云 OSS
- **AI 模型**: DeepSeek / KIMI / Qwen-VL

---

## 基础信息

| 项目 | 值 |
|------|-----|
| 后端地址 | `http://localhost:7001` (默认) |
| 前端地址 | `http://localhost:3000` (默认) |
| API 基础路径 | `/api` |
| 通信协议 | HTTP / SSE (Server-Sent Events) |

---

## API 接口

### 1. 健康检查

```
GET /
```

**响应**: `Welcome to the API server!`

---

### 2. 获取 React TypeScript 模板

```
GET /api/template/react-ts
```

**描述**: 获取基础 React TypeScript 项目模板文件

**响应格式**:
```json
{
  "/package.json": { "code": "..." },
  "/tsconfig.json": { "code": "..." },
  "/src/App.tsx": { "code": "..." },
  ...
}
```

**用途**: 在代码沙盒中初始化项目时使用

---

### 3. 图片上传

```
POST /api/upload/image
```

**描述**: 上传图片到阿里云 OSS

**请求类型**: `multipart/form-data`

**参数**:
| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| file | File | 是 | 图片文件，支持 .jpg, .jpeg, .png, .gif, .webp, .svg，最大 10MB |

**响应格式**:
```json
{
  "url": "https://bucket.oss-endpoint.com/images/20240101-uuid.jpg",
  "name": "original-filename.jpg"
}
```

**错误响应**:
| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | No file uploaded | 未上传文件 |
| 400 | File too large | 文件超过 10MB |
| 400 | Unsupported file type | 不支持的文件类型 |
| 500 | OSS not configured | OSS 未配置 |
| 500 | Upload failed | 上传失败 |

---

### 4. 代码生成 (核心接口)

```
POST /api/chat
```

**描述**: 根据用户输入生成前端代码，使用 SSE (Server-Sent Events) 流式返回结果

**请求头**:
```
Content-Type: application/json
Accept: text/event-stream
```

**请求体**:
```json
{
  "messages": [
    {
      "id": "msg-001",
      "role": "user",
      "content": "帮我生成一个登录页面",
      "attachments": [
        {
          "type": "image",
          "url": "https://example.com/image.png",
          "id": "img-001",
          "name": "design.png"
        }
      ]
    }
  ],
  "projectId": "project-123",
  "mockConfig": {
    "enabled": true,
    "preset": "full"
  }
}
```

**参数说明**:
| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| messages | ChatMessage[] | 是 | 对话消息数组 |
| projectId | string | 否 | 项目 ID，用于对话隔离，不传则自动生成 |
| mockConfig | MockConfig | 否 | Mock 模式配置 (仅 Traditional 流程使用) |

**ChatMessage 结构**:
```typescript
interface ChatMessage {
  id: string;           // 消息唯一 ID
  role: "user" | "assistant";
  content: string;      // 消息内容
  attachments?: Array<{
    type: "image";
    url: string;
    id?: string;
    name?: string;
  }>;
}
```

**MockConfig 结构** (Traditional 流程):
```typescript
interface MockConfig {
  enabled: boolean;     // 是否启用 Mock
  preset?: "minimal" | "partial" | "full";  // Mock 预设级别
}
```

---

## SSE 响应格式

代码生成接口使用 SSE 流式返回，事件格式如下：

```
data: {"type": "eventType", "data": {...}}

data: {"type": "eventType", "data": {...}}

data: {"type": "done"}
```

### 事件类型

根据路由选择的不同流程，返回的事件类型不同：

#### Traditional 流程事件

| 事件类型 | 说明 | 数据结构 |
|----------|------|----------|
| `analysis` | 需求分析结果 | AnalysisResult |
| `intent` | 意图分析结果 | IntentResult |
| `capabilities` | 能力分析结果 | CapabilitiesResult |
| `ui` | UI 设计规范 | UIDesignResult |
| `components` | 组件设计结果 | ComponentsResult |
| `structure` | 项目结构 | StructureResult |
| `dependency` | 依赖配置 | DependencyResult |
| `types` | TypeScript 类型定义 | TypesResult |
| `utils` | 工具函数 | UtilsResult |
| `mockData` | Mock 数据 | MockDataResult |
| `service` | 服务层代码 | ServiceResult |
| `hooks` | Hooks 代码 | HooksResult |
| `componentsCode` | 组件代码 | ComponentsCodeResult |
| `pagesCode` | 页面代码 | PagesCodeResult |
| `layouts` | 布局代码 | LayoutsResult |
| `styles` | 样式代码 | StylesResult |
| `app` | 应用入口代码 | AppResult |
| `files` | 最终文件组装结果 | FilesResult |

#### Figma 流程事件

| 事件类型 | 说明 | 数据结构 |
|----------|------|----------|
| `figmaRawCode` | Figma MCP 获取的原始代码 | RawCodeResult |
| `figmaImageProcessed` | 图片下载处理结果 | ImageProcessedResult |
| `figmaAstParsed` | AST 解析结果 | AstParsedResult |
| `figmaBlockExtract` | 布局块提取结果 | BlockExtractResult |
| `figmaGeometryGroup` | 几何聚类结果 | GeometryGroupResult |
| `figmaSectionNaming` | 区块命名结果 | SectionNamingResult |
| `figmaComponentGen` | 组件生成结果 | GeneratedFilesResult |
| `figmaAssembly` | 最终组装结果 | FilesResult |

#### 通用事件

| 事件类型 | 说明 |
|----------|------|
| `done` | 流程完成 |
| `error` | 发生错误 |

---

## 路由适配逻辑

系统根据用户输入自动选择处理流程：

### 路由优先级 (从高到低)

1. **Figma 路由** - 检测消息中是否包含 Figma URL
   - 触发条件: 消息内容匹配 `https?://([\w.-]+\.)?figma\.com/(file|design|proto|board)/[\w-]+`
   - 使用流程: Figma 直连流程

2. **修改路由** - 检测是否为修改请求
   - 触发条件: 用户意图为修改已有代码
   - 使用流程: Traditional 流程 (修改模式)

3. **图片路由** - 检测是否包含图片附件
   - 触发条件: messages 中包含图片 attachments
   - 使用流程: Traditional 流程 (图片分析模式)

4. **提示词路由** - 检测是否为纯文本提示词
   - 触发条件: 普通文本描述
   - 使用流程: Traditional 流程

5. **回退路由** - 默认处理
   - 使用流程: Traditional 流程

---

## 完整的 SSE 响应示例

### Traditional 流程示例

```
data: {"type": "analysis", "data": {"requirement": "登录页面", "features": [...]}}

data: {"type": "intent", "data": {"primaryIntent": "authentication", ...}}

data: {"type": "ui", "data": {"designSystem": {...}, "theme": {...}}}

...

data: {"type": "files", "data": {"/src/App.tsx": "...", "/src/components/LoginForm.tsx": "..."}}

data: {"type": "done"}
```

### Figma 流程示例

```
data: {"type": "figmaRawCode", "data": {"code": "...", "metadata": {...}}}

data: {"type": "figmaImageProcessed", "data": {"images": [...]}}

data: {"type": "figmaAstParsed", "data": {"ast": {...}}}

...

data: {"type": "figmaAssembly", "data": {"/src/App.tsx": "...", "/src/components/...": "..."}}

data: {"type": "done"}
```

---

## 错误处理

### SSE 错误事件

当处理过程中发生错误时，会返回 error 事件：

```
data: {"type": "error", "data": {"message": "错误描述信息"}}
```

### HTTP 错误响应

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 404 | 资源未找到 |
| 500 | 服务器内部错误 |

---

## 环境变量配置

后端服务依赖以下环境变量 (位于 `server/.env`)：

### AI 模型配置

| 变量名 | 说明 |
|--------|------|
| `MAIN_MODEL_PROVIDER` | 主模型提供商: `deepseek` / `kimi` / `qwen` |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 |
| `DEEPSEEK_MODEL` | DeepSeek 模型名 (默认: deepseek-chat) |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址 |
| `KIMI_API_KEY` | Moonshot AI API 密钥 |
| `KIMI_MODEL` | Moonshot AI 模型名 (默认: moonshot-v1-8k) |
| `KIMI_BASE_URL` | Moonshot AI API 地址 |
| `QWEN_API_KEY` | 通义千问 API 密钥 |
| `QWEN_MODEL` | 通义千问模型名 (默认: qwen-vl-max) |
| `QWEN_BASE_URL` | 通义千问 API 地址 |

### Figma MCP 配置

| 变量名 | 说明 |
|--------|------|
| `FIGMA_MCP_URL` | Figma MCP Server URL |
| `FIGMA_MCP_SERVER_URL` | Figma MCP Server URL (备选) |
| `FIGMA_API_KEY` | Figma API 密钥 |
| `DEBUG_FIGMA` | Figma 调试模式: `true` / `false` |

### 阿里云 OSS 配置

| 变量名 | 说明 |
|--------|------|
| `ALI_OSS_AK` | OSS AccessKey ID |
| `ALI_OSS_SK` | OSS AccessKey Secret |
| `ALI_OSS_ENDPOINT` | OSS Endpoint |
| `ALI_OSS_BUCKET` | OSS Bucket 名称 |

### 服务器配置

| 变量名 | 说明 |
|--------|------|
| `PORT` | 服务器端口 (默认: 7001) |
| `MOCK_MODE` | 全局 Mock 模式: `true` / `false` |

---

## 对接示例

### JavaScript/TypeScript 对接示例

```typescript
// 1. 获取模板
const template = await fetch("http://localhost:7001/api/template/react-ts")
  .then(r => r.json());

// 2. 上传图片
const formData = new FormData();
formData.append("file", imageFile);
const uploadResult = await fetch("http://localhost:7001/api/upload/image", {
  method: "POST",
  body: formData
}).then(r => r.json());
// uploadResult.url 为图片 URL

// 3. 代码生成 (SSE)
const response = await fetch("http://localhost:7001/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "text/event-stream"
  },
  body: JSON.stringify({
    messages: [{
      id: "msg-1",
      role: "user",
      content: "生成一个登录页面"
    }],
    projectId: "my-project-123"
  })
});

// 读取 SSE 流
const reader = response.body!.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n\n");
  buffer = lines.pop() || "";
  
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const event = JSON.parse(line.slice(6));
      console.log("Event:", event.type, event.data);
      
      if (event.type === "files") {
        // 最终文件结果
        console.log("Generated files:", event.data);
      }
      
      if (event.type === "done") {
        console.log("Generation completed");
      }
    }
  }
}
```

### Python 对接示例

```python
import requests
import json
import re

# 1. 获取模板
response = requests.get("http://localhost:7001/api/template/react-ts")
template = response.json()

# 2. 上传图片
with open("design.png", "rb") as f:
    response = requests.post(
        "http://localhost:7001/api/upload/image",
        files={"file": f}
    )
    image_url = response.json()["url"]

# 3. 代码生成 (SSE)
import sseclient

response = requests.post(
    "http://localhost:7001/api/chat",
    headers={
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
    },
    json={
        "messages": [{
            "id": "msg-1",
            "role": "user",
            "content": "生成一个登录页面"
        }],
        "projectId": "my-project-123"
    },
    stream=True
)

client = sseclient.SSEClient(response)
for event in client.events():
    data = json.loads(event.data)
    print(f"Event: {data['type']}")
    
    if data["type"] == "files":
        print(f"Generated files: {data['data']}")
    
    if data["type"] == "done":
        print("Generation completed")
        break
```

### cURL 示例

```bash
# 获取模板
curl http://localhost:7001/api/template/react-ts

# 上传图片
curl -X POST http://localhost:7001/api/upload/image \
  -F "file=@design.png"

# 代码生成 (SSE)
curl -X POST http://localhost:7001/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [{
      "id": "msg-1",
      "role": "user",
      "content": "生成一个登录页面"
    }],
    "projectId": "my-project-123"
  }'
```

---

## 注意事项

1. **SSE 连接**: 确保客户端支持并正确处理 SSE 流式响应
2. **项目隔离**: 使用 `projectId` 实现对话隔离，相同 projectId 的对话会共享上下文
3. **Figma URL**: Figma 流程需要有效的 Figma 设计稿 URL 和 MCP Server 配置
4. **图片上传**: 图片上传后返回的 URL 可直接用于 messages.attachments
5. **Mock 模式**: 开发调试时可启用 MOCK_MODE，后端将返回预设的 Mock 数据
6. **环境变量**: 对接前确保所有必需的环境变量已正确配置

---

## 相关文件

- 后端路由: `server/routes/`
- 前端 API 服务: `frontend/src/services/api.ts`
- 事件映射配置: `server/config/chat.ts`
- 路由适配器: `server/agents/adapters/`

---

*文档版本: 1.0*  
*更新时间: 2026-04-14*
