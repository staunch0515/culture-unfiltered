# 内容编辑指南（中文）

Culture, Unfiltered 的所有内容（人、故事、主题、国家、资源）都在网站后台编辑：
**https://cultureunfiltered.org/admin/**

不需要写代码。保存后网站会自动更新，通常 5 分钟左右生效。

---

## 1. 第一次使用前

1. **注册一个 GitHub 账号**（免费）：https://github.com/signup
2. **把你的 GitHub 用户名发给项目负责人**，请他把你加为仓库协作者（Write 权限）。
3. **接受邀请**：GitHub 会发邀请邮件，点里面的链接接受。不接受就无法登录后台。

## 2. 登录

1. 打开 https://cultureunfiltered.org/admin/
2. 点 **Login with GitHub**，会弹出一个小窗口。
3. 第一次登录时 GitHub 会问是否授权 “Culture Unfiltered CMS”，点 **Authorize**。
4. 小窗口自动关闭，就进入后台了。

弹窗没出现？检查浏览器是否拦截了弹出窗口，允许本网站弹窗后再试。

## 3. 保存就是发布

- 点右上角 **Publish → Publish now** 后，修改会立刻提交，网站在几分钟内更新。
- 网站在发布前会自动检查内容（比如必填项、名字格式）。检查不通过，网站**不会**更新，旧版本继续在线，负责人会收到通知。
- 想先藏起来不公开：人物页有 **Published** 开关，关掉后这个人在全站都不显示。故事也有同样的开关。

## 4. 加一个人（People → New Person）

| 字段 | 怎么填 |
| --- | --- |
| First name | **只写名，不写姓**（参与者是未成年人）。不能有空格。 |
| Country | 从列表里选。没有这个国家？先去 Countries 里加。 |
| Region or city | 最多写到城市或地区。**不要写学校、街道、小区。** |
| Portrait | 头像。插画最好；如果用照片，必须本人和监护人都同意。 |
| Portrait description | 用一句话描述这张图，给看不见图片的人用。 |
| Short bio | 一两句话介绍。 |
| Interests / Languages | 每项单独加一行。 |
| My Perspective | “我的视角”一段话。 |
| Reflection | 可选。 |

文件名会根据名字自动生成，比如 “Inês” 会变成 `ines`。

## 5. 加一个故事（Stories → New Story）

先确认故事里的每位参与者都已经在 People 里。

| 字段 | 怎么填 |
| --- | --- |
| Title / Short description | 标题和一两句简介（显示在卡片上）。 |
| Date | 发布日期。 |
| Made by | 选参与者，可以多选。 |
| Themes | 选主题，可以多选。 |
| Format | 视频、文章、照片、采访或音频。 |
| Cover image + description | 封面图（横图最好）和图片描述。 |
| Video | 只有视频故事才填。选 YouTube 或 Vimeo，**只填视频 ID**：YouTube 链接 `youtube.com/watch?v=aqz-KE-bpKQ` 里的 `aqz-KE-bpKQ`；Vimeo 链接 `vimeo.com/1084537` 里的 `1084537`。有字幕就勾选 Has captions。 |
| Audio | 只有音频故事才填。上传音频文件，最好附上文字稿。 |
| Photos | 照片故事用。**每张照片都要写描述。** |
| Perspectives | 每位参与者一段话（或一个视频）。 |
| Reflection | 三个问题：我们惊讶什么、我们原本以为什么、我们学到了什么。 |
| Story text | 正文。可以用加粗、标题、列表。 |

视频不会存到我们的网站上，只会在访客点击播放时才从 YouTube 或 Vimeo 加载。

## 6. 加一个资源（Resources → New Resource）

填标题、简介、类型（课堂活动、讨论指南、反思题、语言交流）、适合年龄、时长。
可以上传 PDF，可以关联相关故事。“Instructions” 里写具体步骤。

## 7. 加主题或国家

- **Themes**：标题、表情符号、一个问题（例如 “What makes somewhere feel like home?”）、简介、排序数字（越小越靠前）。
- **Countries**：名字、国旗表情、地图坐标（纬度、经度，可以在网上搜 “国家名 latitude longitude”）、排序。ISO 数字可选，填了地图上这个国家会高亮。

## 8. 网站设置（Site settings）

后台左侧最下面的 **Site settings** 里有全站设置：

- **Show the placeholder notice**：每页最上面那条“占位内容”提示。等真实的人物和故事替换掉示例内容后，把它关掉。
- **Notice text**：提示的文字，最多 140 个字符。

保存后和其他修改一样，几分钟后网站更新。

## 9. 谁改了什么

每次保存都会以**你自己的 GitHub 账号**提交，所以修改记录一目了然：

- **全部修改历史**：https://github.com/staunch0515/culture-unfiltered/commits/main
  每一条都写着谁、什么时候、改了哪个条目（提交说明里有 “via CMS by 用户名”）。点进去能看到具体改了哪些字。
- **某个文件的历史**：在 GitHub 打开那个文件，点 **History**。

改错了？再编辑一次保存即可。需要整体撤回时，请负责人在 GitHub 上恢复那次提交。

## 10. 常见问题

- **“Your GitHub user account does not have access to this repo.”**：你还不是协作者，或者还没接受邀请。
- **保存后网站没变**：等 5 分钟再刷新。还没变，请负责人查看 GitHub 的 Actions 页面，可能是内容检查没通过。
- **图片太大**：尽量把照片缩到宽 2000 像素以内再上传。

## 11. 在自己电脑上试用（给懂技术的人）

```bash
npm install
npm run dev
```

另开一个终端：

```bash
npm run cms:local
```

然后打开 http://localhost:4321/admin/ ，不用登录，修改直接写到本地文件。
