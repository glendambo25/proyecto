# Deploy / preview

## Today: GitHub Codespaces (free, private, no new accounts)

The repo is private and the owner account is on GitHub Free, so GitHub Pages is
not available. Instead, any collaborator can open a private preview from their
own browser:

**Link:** https://codespaces.new/glendambo25/proyecto?ref=infra/deploy&quickstart=1

1. Open the link (signed in to GitHub) and click **Create codespace**.
2. Wait ~2–3 minutes: it installs, builds and runs `npm start`.
3. The app opens in a new tab (`https://<name>-3000.app.github.dev`). If not, open the
   **Ports** tab and click the globe next to port 3000.
4. Demo: append `/?demo=priya&design=chart` to that URL.

Cost: Codespaces is billed to the person who creates it, from GitHub's free monthly
quota for personal accounts (plenty for previews). Stop the codespace when done
(github.com/codespaces → ⋯ → Stop); it also stops itself after 30 min idle.

What works there:

| Feature | Status |
|---|---|
| Onboarding, checklist, step detail, map, demo links | Works |
| Text assistant | Offline mode (no `ANTHROPIC_API_KEY`): canned answers from `offlineAnswer` |
| Voice agent | Not working without `OPENAI_API_KEY` (mic access itself is fine: the URL is HTTPS) |

To enable the online assistant/voice for yourself only, add `ANTHROPIC_API_KEY` /
`OPENAI_API_KEY` as **your own** Codespaces secrets (github.com/settings/codespaces,
scoped to this repo). Never commit keys.

### Updating the preview

`infra/deploy` is `redesign/impeccable` + `.devcontainer/` + this file. To pick up new
UI work:

```bash
git checkout infra/deploy
git merge origin/redesign/impeccable
git push origin infra/deploy
```

Existing codespaces then need `git pull && npm run build && npm start` (or just
delete and create a new one). The two files can also be merged into any other
branch; then use `?ref=<that-branch>` in the link.

## Later: a permanent public URL

Options, all needing one decision from the founder:

- **Make the repo public → GitHub Pages.** Free, auto-deploy via Actions. Requires a
  static export (`output: 'export'` behind an env flag), `generateStaticParams` for
  `/tasks/[id]` and `/chat/[id]`, and running the assistant's offline mode client-side.
  Voice would not work (no server).
- **Netlify / Cloudflare Pages / Vercel** with the repo connected: one account to
  create, full Next.js incl. API routes; keys stored as hosting secrets.
