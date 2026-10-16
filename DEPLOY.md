# 部署说明

本项目是 Astro 生成的纯静态网站。镜像里用非 root 的 nginx 托管静态文件，容器内端口 8080。
外部入口只有服务器上的 Caddy，它负责 HTTPS 和压缩。

| 参数 | 值 |
| --- | --- |
| APP_NAME | `culture_unfiltered` |
| DOMAIN | `cultureunfiltered.org` |
| GITHUB_REPO | `staunch0515/culture-unfiltered` |
| 镜像 | `ghcr.io/staunch0515/culture-unfiltered:<commit SHA>` |
| 容器名 | `culture_unfiltered-web` |
| NEEDS_DB | `no` |
| SERVER_ARCH | `linux/amd64`（Hetzner CX23） |

## 首次部署前在服务器上做的事

1. **不需要建数据库。** 本项目不用 Postgres，不要运行 `create-db.sh`，容器也不加入 `db` 网络。

2. **建应用目录和空的 `.env`。** compose 引用了 `.env`，文件必须存在，目前不需要任何变量：

   ```bash
   sudo mkdir -p /opt/apps/culture_unfiltered
   sudo touch /opt/apps/culture_unfiltered/.env
   ```

   `.env` 只在服务器上手动维护，workflow 不会覆盖它。以后如果需要变量，按 `KEY=value` 一行一个写进去。

3. **DNS。** 给 `cultureunfiltered.org` 添加 A 记录，指向服务器的公网 IPv4。服务器有 IPv6 的话再加一条 AAAA 记录。
   如果也想让 `www.cultureunfiltered.org` 可用，要另加 DNS 记录，并在 `deploy/site.caddy` 里加一个跳转站点。

4. **GitHub Secrets** 已配置：`SERVER_HOST`、`SERVER_USER`、`SERVER_SSH_KEY`、`SERVER_KNOWN_HOSTS`。镜像推送和服务器拉取用内置的 `GITHUB_TOKEN`。

## 日常部署

- **自动部署**：每次推送到 `main`，GitHub Actions 依次运行测试、构建并推送镜像，然后通过 SSH 执行
  `/opt/infra/scripts/deploy-app.sh culture_unfiltered <commit SHA>`。测试不通过就不会部署。
- **手动触发**：GitHub 仓库 → Actions → deploy → Run workflow，`image_tag` 留空，会重新测试、构建并部署所选分支。

## 回滚

- **在 GitHub 上**：Actions → deploy → Run workflow，在 `image_tag` 里填旧版本的完整 commit SHA。
  这样会跳过测试和构建，直接部署这个已有镜像。
- **在服务器上**：

  ```bash
  /opt/infra/scripts/deploy-app.sh culture_unfiltered <旧的 commit SHA>
  ```

  如果 GHCR 包是私有的，服务器上的 docker 需要仍处于登录状态。

部署失败时，`deploy-app.sh` 会自动回滚到上一个 tag。

## 健康检查

容器内 `GET /healthz` 返回 `ok`，不依赖任何外部服务。compose 的 healthcheck 用镜像自带的 busybox `wget` 调用它。
