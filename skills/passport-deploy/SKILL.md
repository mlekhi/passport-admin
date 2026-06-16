---
name: passport-deploy
description: Publish a static site to a live, login-protected URL the user can share immediately. Use when someone wants to publish, share, deploy, or "put online" a website/page they've been building this session and get a shareable link back. Triggers include "publish this", "share this site", "put this online", "make it live", "give me a link", "deploy this page".
---

# Publish a site behind Passport

Take the static site the user has been building and make it live: zip it, send it
to the passport gateway, and hand back a single shareable URL. The gateway deploys
it as its own Vercel project and protects it behind the org's login, so only org
members can open the link.

This is for **non-technical users**. They want a link, not a build log. Never show
them error codes, file paths, or curl output — translate everything into plain
language, and fix problems yourself instead of asking them to.

## When to use

The user has been building a website/page with you this session and now wants to
see it live or share it — "publish this", "share it", "put it online", "make it
live", "give me a link".

## How to publish

1. **Collect the site into one folder.** Put every file the page needs (HTML, CSS,
   JS, images, fonts, favicons) into a single directory. It must have an
   **`index.html` at the top level** — that's the homepage served at `/`. If the
   main page has another name, copy or rename it to `index.html`. If there's no
   homepage at all, create a simple one. Don't ask the user to do any of this.

2. **Run the bundled script** on that folder:

   ```bash
   bash <skill-dir>/deploy.sh <site-folder>
   ```

   (`<skill-dir>` is this skill's own directory — the folder this `SKILL.md` lives
   in.) It zips the folder and uploads it. Wait for it to finish (a deploy takes a
   few seconds up to a minute).

3. **On success** the script prints just the URL. Give it to the user warmly and
   plainly, e.g.:

   > Your site is live and protected behind your org's login:
   > **https://app-xxxx.vercel.app**
   > Anyone on your team who opens it will sign in first.

4. **On failure** the script prints `ERROR <code>: <message>`. Don't surface that.
   Look up the code below, **fix it, and run the script again** — only fall back to
   telling the user if you genuinely can't resolve it.

## Fixing failures (translate, fix, retry)

| Code | What it means | What to do |
|------|---------------|------------|
| `no_root_index` | No homepage at the top level | Make sure one file is named `index.html` at the folder root (rename/copy the main page, or create a basic one), then retry. |
| `not_static` | The folder has build/server files (a `package.json`, `vercel.json`, an `api/` folder, or server code like `.py`/`.go`) — this host only takes plain static sites | Remove those files from the folder (keep just the static HTML/CSS/JS/assets) and retry. If the site genuinely needs a build, tell the user it can't be hosted here yet. |
| `empty` | Nothing to deploy | Confirm the folder actually contains the site's files, then retry. |
| `duplicate` | The same file path appears twice | Remove the duplicate and retry. |
| `bad_zip` | The upload didn't package correctly | Just run the script again. |
| `bad_request` | (Shouldn't happen via the script) | Re-run the script. |

## If the script can't run

Fall back to doing it by hand from the site folder:

```bash
cd <site-folder>
zip -r -q /tmp/site.zip . -x '.git/*' 'node_modules/*' '.DS_Store' '__MACOSX/*'
curl -sS -F "file=@/tmp/site.zip;filename=site.zip" \
  https://passport-admin-tan.vercel.app/api/deploy
```

A `200` response contains `{"url":"..."}` — that's the live link. Any other
response contains a `code` field; handle it using the table above.

## Notes

- Each publish creates a **new** URL — there's no update-in-place yet, so
  re-publishing makes a fresh link.
- The site is **always** protected behind the org's login; you can't make an
  unauthenticated public link through this gateway.
