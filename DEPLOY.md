# 部署说明

网站是 Astro 生成的纯静态站点，用非 root 的 nginx 托管，容器内端口 8080。
内容后台 `/admin` 用 Decap CMS，编辑用自己的 GitHub 账号登录。登录需要一个很小的无状态服务 `cms-auth`，容器内端口 8081，不用数据库。
外部入口只有服务器上的 Caddy：`/cms-auth/*` 转给 cms-auth，其余转给网站。

| 参数 | 值 |
| --- | --- |
| APP_NAME | `culture_unfiltered` |
| DOMAIN | `cultureunfiltered.org` |
| GITHUB_REPO | `staunch0515/culture-unfiltered` |
| 网站镜像 | `ghcr.io/staunch0515/culture-unfiltered-web:<commit SHA>` |
| 后台登录镜像 | `ghcr.io/staunch0515/culture-unfiltered-cms:<commit SHA>` |
| 容器名 | `culture_unfiltered-web`、`culture_unfiltered-cms` |
| NEEDS_DB | `no` |
| SERVER_ARCH | `linux/amd64`（Hetzner CX23） |

## 首次部署前（已完成的可跳过）

1. **不需要数据库。** 不要运行 `create-db.sh`，容器也不加入 `db` 网络。
2. **应用目录和 `.env`**：

   ```bash
   sudo mkdir -p /opt/apps/culture_unfiltered
   sudo touch /opt/apps/culture_unfiltered/.env
   ```

3. **DNS**：`cultureunfiltered.org` 的 A 记录指向服务器公网 IPv4（有 IPv6 再加 AAAA）。
4. **GitHub Secrets**：`SERVER_HOST`、`SERVER_USER`、`SERVER_SSH_KEY`、`SERVER_KNOWN_HOSTS`。

## 开启内容后台（一次性）

没配置这一步时，网站照常运行，只是 `/admin` 无法登录。

1. **创建 GitHub OAuth App**：GitHub 右上角头像 → Settings → Developer settings → OAuth Apps → New OAuth App。

   | 字段 | 填写 |
   | --- | --- |
   | Application name | `Culture Unfiltered CMS` |
   | Homepage URL | `https://cultureunfiltered.org` |
   | Authorization callback URL | `https://cultureunfiltered.org/cms-auth/callback` |

   创建后复制 **Client ID**，再点 **Generate a new client secret** 复制密钥（只显示一次）。

2. **写入服务器的 `/opt/apps/culture_unfiltered/.env`**（示例格式，换成真实值）：

   ```text
   GITHUB_OAUTH_CLIENT_ID=Ov23liXXXXXXXXXXXXXX
   GITHUB_OAUTH_CLIENT_SECRET=0123456789abcdef0123456789abcdef01234567
   ```

   `CMS_PUBLIC_ORIGIN` 和 `PORT` 已写在 `deploy/compose.yaml` 里，不用放进 `.env`。

3. **让后台读到新配置**：用当前线上版本重新部署一次。最简单的是在 GitHub 的 Actions → deploy → Run workflow，`image_tag` 填当前线上的 commit SHA。也可以在服务器上运行这两行：

   ```bash
   TAG=$(docker inspect -f '{{.Config.Image}}' culture_unfiltered-web | sed 's/.*://')
   ```

   ```bash
   /opt/infra/scripts/deploy-app.sh culture_unfiltered "$TAG"
   ```

   如果 `.env` 在下一次推送部署之前就已经填好，这一步可以省略。

4. **检查**：

   ```bash
   curl -s https://cultureunfiltered.org/cms-auth/health
   ```

   返回里没有 `"configured":false` 就说明配置生效。

5. **添加编辑**：仓库 Settings → Collaborators → Add people，角色选 **Write**。对方接受邀请邮件后，就能在 `/admin` 用 GitHub 登录。
   移除编辑同样在这里操作。

如果给 `main` 分支开了“必须通过 PR 合并”的保护规则，后台直接保存会失败，需要关掉这条规则或允许协作者直接推送。

## 日常部署

- **自动**：每次推送到 `main`（包括编辑在后台保存），Actions 依次运行测试、构建两个镜像、通过 SSH 执行 `deploy-app.sh culture_unfiltered <commit SHA>`。测试不通过就不部署，线上保持旧版本。
- **手动**：Actions → deploy → Run workflow，`image_tag` 留空。

## 回滚

- **GitHub 上**：Actions → deploy → Run workflow，`image_tag` 填旧版本的完整 commit SHA。
- **服务器上**：

  ```bash
  /opt/infra/scripts/deploy-app.sh culture_unfiltered <旧的 commit SHA>
  ```

部署失败时 `deploy-app.sh` 会自动回滚到上一个 tag。

注意：从这一版起镜像改名为 `-web` 和 `-cms`。这之前的版本只有旧名字的镜像，不能用上面的方法回滚过去。

## 谁改了什么

编辑用自己的 GitHub 账号保存，每次修改都是一条以本人为作者的提交：
https://github.com/staunch0515/culture-unfiltered/commits/main

## 健康检查

- 网站：容器内 `GET /healthz` 返回 `ok`，compose 用 busybox `wget` 调用。
- 后台登录：`GET /cms-auth/health`，compose 用 `node src/healthcheck.js` 调用。缺 OAuth 配置时仍返回健康，只是登录接口返回 503，避免拖累网站部署。
