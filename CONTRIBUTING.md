# Contributing

Discuss substantial workflow changes in an issue first. Small fixes can go directly to a pull request. Include the user problem, expected behavior and Ubuntu desktop/session.

Use Node 24 and the committed lockfile. Run `npm ci`, `npx --no install-electron`, `npm run lint`, `npm test`, `npm run test:desktop`, `npm run dist`, and `npm run test:desktop -- --packaged`. See docs/development.md for GUI prerequisites. `npm run format` formats source and docs.

Keep context isolation and production sandboxing enabled. Renderer Node integration stays disabled. Persistence changes must preserve user data or provide a migration with meaningful tests. Never commit task data, credentials, share tokens, caches or installers.

Use focused commits such as `fix: preserve elapsed time when switching tasks`. Add user-facing changes under `[Unreleased]` in CHANGELOG.md. Pull requests explain the problem, resulting behavior, validation and limitations. Follow docs/releasing.md; never rewrite published release tags/assets.
