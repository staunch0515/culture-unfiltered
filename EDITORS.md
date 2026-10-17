# Content editor guide (English)

Everything on Culture, Unfiltered (people, stories, themes, countries and resources) is edited in the CMS:
**https://cultureunfiltered.org/admin/**

No coding needed. When you save, the site rebuilds itself, usually within about 5 minutes.

---

## 1. Before your first time

1. **Create a GitHub account** (free): https://github.com/signup
2. **Send your GitHub username to the project lead**, who adds you as a collaborator on the repository (Write access).
3. **Accept the invitation** in the email GitHub sends you. You cannot log in until you accept.

## 2. Logging in

1. Open https://cultureunfiltered.org/admin/
2. Press **Login with GitHub**. A small window opens.
3. The first time, GitHub asks whether to authorize “Culture Unfiltered CMS”. Press **Authorize**.
4. The window closes and you are in.

No window? Your browser may be blocking pop-ups. Allow pop-ups for this site and try again.

## 3. Saving is publishing

- **Publish → Publish now** commits your change straight away and the site updates within minutes.
- Before publishing, the site checks the content automatically (required fields, name rules and so on). If a check fails, the site is **not** updated, the previous version stays online, and the project lead is notified.
- To hide something without deleting it, switch off **Published** on a person or story. Hidden people disappear everywhere on the site.

## 4. Add a person (People → New Person)

| Field | What to enter |
| --- | --- |
| First name | **First name only, never a surname** (participants are minors). No spaces. |
| Country | Pick from the list. Missing? Add it under Countries first. |
| Region or city | City or region at most. **Never a school, street or neighbourhood.** |
| Portrait | An illustration is best. A photo only with the participant’s and guardian’s consent. |
| Portrait description | One sentence describing the image, for people who cannot see it. |
| Short bio | One or two sentences. |
| Interests / Languages | One item per line. |
| My Perspective | The “My Perspective” paragraph. |
| Reflection | Optional. |

The file name is made from the name automatically, for example “Inês” becomes `ines`.

## 5. Add a story (Stories → New Story)

Make sure every contributor already exists under People.

| Field | What to enter |
| --- | --- |
| Title / Short description | Title and one or two sentences for the card. |
| Date | Publication date. |
| Made by | The participants. Pick several if needed. |
| Themes | One or more themes. |
| Format | Video, article, photo essay, interview or audio. |
| Cover image + description | A landscape image and its description. |
| Video | Video stories only. Choose YouTube or Vimeo and enter **only the video id**: `aqz-KE-bpKQ` from `youtube.com/watch?v=aqz-KE-bpKQ`, or `1084537` from `vimeo.com/1084537`. Tick Has captions if it has them. |
| Audio | Audio stories only. Upload the file and, ideally, a transcript. |
| Photos | For photo essays. **Every photo needs a description.** |
| Perspectives | One short text (or video) per participant. |
| Reflection | Three questions: what surprised us, what we assumed, what we learned. |
| Story text | The main text. Bold, headings and lists all work. |

Videos are never stored on our site. They load from YouTube or Vimeo only when a visitor presses play.

## 6. Add a resource (Resources → New Resource)

Enter the title, description, type (classroom activity, discussion guide, reflection prompt, language exchange), age group and duration.
You can upload a PDF and link related stories. Put the steps under “Instructions”.

## 7. Add a theme or a country

- **Themes**: title, emoji, one question (for example “What makes somewhere feel like home?”), description and an order number (lower comes first).
- **Countries**: name, flag emoji, map position (latitude and longitude; search “country latitude longitude”) and order. The ISO number is optional and highlights the country outline on the map.

## 8. Site settings

**Site settings**, at the bottom of the CMS sidebar, holds site-wide options:

- **Show the placeholder notice**: the thin notice at the top of every page. Turn it off once real people and stories have replaced the sample content.
- **Notice text**: the wording of that notice, up to 140 characters.

Saving works like any other change: the site updates within a few minutes.

## 9. Who changed what

Every save is committed under **your own GitHub account**, so the record is clear:

- **All changes**: https://github.com/staunch0515/culture-unfiltered/commits/main
  Each entry shows who, when and which item changed (the message ends with “via CMS by username”). Open it to see exactly what changed.
- **History of one file**: open the file on GitHub and press **History**.

Made a mistake? Edit again and save. To undo a whole change, ask the project lead to revert that commit on GitHub.

## 10. Common problems

- **“Your GitHub user account does not have access to this repo.”** You are not a collaborator yet, or you have not accepted the invitation.
- **The site did not change after saving.** Wait 5 minutes and refresh. If it still has not changed, ask the project lead to check the Actions page on GitHub; a content check may have failed.
- **Images are too large.** Resize photos to at most 2000 pixels wide before uploading.

## 11. Trying it on your own computer (for technical people)

```bash
npm install
npm run dev
```

In a second terminal:

```bash
npm run cms:local
```

Then open http://localhost:4321/admin/. No login is needed and changes are written to your local files.
