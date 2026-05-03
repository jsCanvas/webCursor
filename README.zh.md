# webCursor 一键 Docker 栈

本文介绍了一个具备全自动开发和一键部署能力的 AI 智能体系统，只需提供 Git 仓库与访问令牌，即可由系统为你完成全栈开发与部署，并且支持移动端编程，实现随时随地——掏出手机就能完成开发。

> 英文版原文：[README.md](https://github.com/jsCanvas/webCursor/blob/main/README.md)

本目录自持一套 **dockerBot API + Agent 沙箱**、以 **Nginx** 托管的 **clientCoder** Web IDE，以及 **phoneCoder Web**（Expo 静态导出）。所有构建资源均在 `webCursor` 内，通过一条脚本即可完成构建与启动。

## 前置条件

- 已安装 **Docker Engine / Desktop**，且可使用 **Compose v2**（命令为 `docker compose`）。
- 已启动 Docker 守护进程（`docker info` 可用）。
- 若 `.env` 中加密密钥仍为占位符，需在宿主机可用的 **`openssl`**，以便脚本自动生成密钥。

## 一键启动并体验项目

在终端进入本目录后执行：

```bash
chmod +x ./scripts/docker-stack.sh   # 仅首次需要 获取权限
./scripts/docker-stack.sh   # 或 bash ./scripts/docker-stack.sh 默认：后台构建并启动
```

等价写法：

```bash
./scripts/docker-stack.sh up
```

首次运行若不存在 `dockerBot/.env`，脚本会从 `dockerBot/.env.example` 复制一份；若 `PHONEBOT_ENCRYPTION_KEY` 仍为占位符，会自动替换为随机 64 位十六进制密钥。SQLite 与工作区数据目录会挂载在 **`dockerBot/data/`**。

## 启动后访问地址

| 服务 | URL | 说明 |
|------|-----|------|
| 服务端 dockerBot API | `http://127.0.0.1:8080/api` | REST/SSE 等接口基路径 |
| WEB端 clientCoder（Nginx） | `http://127.0.0.1:5371` | 前端静态站点；`/api/*` **反向代理**到 Docker 网络内的 dockerBot API |
| 移动端 phoneCoder Web | `http://127.0.0.1:3000` | 静态 Web 客户端 |

### 客户端里的「后端地址」建议

- **clientCoder**：在连接设置里可填 **`http://127.0.0.1:5371/api`**（浏览器只打到 Nginx，由 Nginx 转发 `/api`），或直接 **`http://127.0.0.1:8080/api`**。
- **phoneCoder**：在手机或其它设备上访问宿主机后端时，需使用宿主机的 **局域网 IP**，例如 `http://192.168.x.x:8080/api`。仅在本机浏览器打开 phoneCoder Web 时，默认指向 `localhost:8080` 即可。

## 常用命令

| 操作 | 命令 |
|------|------|
| 前台跟随日志启动 | `./scripts/docker-stack.sh fg`（或 `./scripts/docker-stack.sh foreground`） |
| 停止并移除本栈容器 | `./scripts/docker-stack.sh down` |
| 查看容器列表 | `./scripts/docker-stack.sh ps` |
| 附加查看日志 | `./scripts/docker-stack.sh logs -f`（可加服务名过滤，与 `docker compose logs` 一致） |
| 校验 Compose | `./scripts/docker-stack.sh config` |

Compose 项目名为 **`webcursor-stack`**。

## 目录与构成（简要）

- `docker-compose.stack.yml`：栈定义。
- `scripts/docker-stack.sh`：环境与 `.env` 准备 + `docker compose up`。
- `dockerBot/`：API 与 Agent **镜像上下文**（`Dockerfile`、`agent.Dockerfile`）；运行依赖预编译 **`dist`** 与生产依赖清单；配置见 `.env.example`。
- `clientCoder/`：`clientcoder-nginx` 镜像构建上下文（Vite 前端源码）。
- `phoneCoder/`：`phonecoder-web` 镜像构建上下文。
- `docker/`、`nginx/`：镜像内 Nginx/Vite、Expo 构建相关 Dockerfile 与站点配置。

## 注意事项与冲突说明

1. **宿主机挂载 Docker**：`dockerbot-api` 与 `dockerbot-agent` 均挂载 **`/var/run/docker.sock`**，用于在您本机 Docker 上创建/管理服务与沙箱。**不会**再在容器里嵌套一整套独立的 Docker Daemon。
2. **固定容器名**：Agent 容器名为 **`phonebot-agent`**（与 `.env` 中 `PHONEBOT_SANDBOX_CONTAINER` 一致）。若你同时在别的目录启动了同名或同端口 **8080** 的 dockerBot 栈，会冲突——请先关闭其中一方。
3. **`dockerBot/dist` 更新**：当前 `dockerBot` 为 **预编译发布树**。若你从上游更新了逻辑，需在具备完整源码的 dockerBot 工程内执行 **`npm ci && npm run build`**，再将生成后的 **`dist`**（及按需的 `package.json` / `package-lock.json`）同步到 **`webCursor/dockerBot/`**，再重新执行 `./scripts/docker-stack.sh`（会触发按需重建镜像）。

---

若 Compose 报错「找不到 `.env`」，请先执行一次 `./scripts/docker-stack.sh` 以自动生成，或手动从 `dockerBot/.env.example` 复制并填写有效 `PHONEBOT_ENCRYPTION_KEY`。

---

## 全栈项目开发部署示列

### 获取项目【Git Access Token】

进入[github](https://github.com/settings/personal-access-tokens)，点击 头像 --> settings --> Developer Settings --> Fine-grained personal access tokens.
创建 Access Token ，添加 **Contents** 读写（**Read and write**）权限【重点】

![添加Contents读写Read and write权限](images/token.png)

获取到Git Access Token后进入 **projects** 页面  创建项目。

### 多轮对话进行项目开发

**prompt示列：**

```
/skill prompt2repo-engineering-rules 
根据技能规则，创建目录label-2026043014，在项目label-2026043014文件目录下按照规范完成开发,以下是我的prompt

帮我生成一个前后端分离的web项目。 

生成卖花管理系系统， 有个类似于购物车的功能，类似还有某个页面最好有个信息表，比如选课信息表实现增删改查功能。

首页支持响应式布局，着重关注页面UI样式，注意页面不要出现样式异常，使用UI组件库的弹窗和提示显示，界面优美，具有设计感。

严格按照UI设计稿还原页面：Implement this design from Figma.
@https://www.figma.com/design/XXXXXXX?node-id=418-56098&m=dev （如果有填写，没有可以去掉）

前端的技术栈是 vue3+vite+Element Plus，前端用axios发请求，遵循restfulAPI，docker映射端口和启动端口必须是3000。

后端使用java + Spring Boot，docker映射端口和启动端口必须是8000。

然后帮我生成数据库的代码或者你直接帮我操作数据库，数据库采用mysql，docker映射端口为3306。
```

**提示词结构：**


 1. 全栈开发技能 /skill prompt2repo-engineering-rules；
 2. 规定项目创建目录；
 3. 描述需求；
 4. UI规范，如果有figma设计稿，可以使用figma mcp直接导入设计稿；
 5. 前端技术栈要求，前端docker映射端口；
 6. 后端技术栈要求，后端docker映射端口；
 7. 数据库技术栈要求，数据库docker映射端口；


**执行结果如下：**

| Models | Projects | Chat | Docker |
| :---: | :---: | :---: | :---: |
| ![Models](images/model.jpeg) | ![Projects](images/project.jpeg) | ![Chat](images/chat.jpeg) | ![Docker](images/docker.jpeg) |

| coding | readme | files | preview |
| :---: | :---: | :---: | :---: |
|![在这里插入图片描述](images/develop1.jpeg)|![在这里插入图片描述](images/develop4.jpeg)|![在这里插入图片描述](images/files.jpeg)|![在这里插入图片描述](images/preview.jpeg)|

### 查看文件并启动项目

进入Files页面，点击项目目录的 docker 图标启动项目；
启动后点击预览，可以查看项目页面；

### AI自动化测试项目

```
/skill prompt2repo-final-checklist 
按照checklist，测试全栈项目label-2026043014
```

**提示词结构：**

 1. 全栈测试技能 /skill prompt2repo-final-checklist；
 2. 规定测试项目目录；


### 进入git页面提交代码

## 欢迎加入星球，获取更多教程
![在这里插入图片描述](images/qiu.png)