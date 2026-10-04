# Release procedure

Use SemVer. All `0.x` releases are GitHub **Pre-release**. Initial version: `v0.1.0`. Stable 1.0 requires recorded testing on real Ubuntu; cloud GUI smoke alone is insufficient. Never move a published tag or replace published assets; fixes require a new version.

## Prepare

1. Update package.json version and lockfile (`npm install --package-lock-only`).
2. Move user-facing changes from `[Unreleased]` to a dated changelog section (YYYY-MM-DD), including migrations, limitations and behavior changes.
3. Review README install/upgrade/uninstall, data handling, platform claims, package metadata and asset licenses.
4. Run `npm ci`, `npx --no install-electron`, `npm run lint`, `npm test`, `npm run test:desktop`, `npm run dist`, `npm run test:desktop -- --packaged`, and `npm run release:check`.
5. On real Ubuntu, check .deb install, planning, switching/completion, restart persistence, drag/stacking, hide/restore, tray quit, native notification, autostart, upgrade and uninstall. Record OS/session. If unrun, disclose it and keep Preview status.
6. Inspect the staged diff for private data, tokens, generated files and unrelated changes. Follow the repository review process. The user authorized direct initial publication to main for this empty repository.

## Publish

```sh
git push origin main
git tag -a v0.1.0 -m "FocusFlow 0.1.0 Preview"
git push origin v0.1.0
```

Actions rebuilds from the tag, verifies tag/version/changelog, tests the packaged application and generates SHA256SUMS. A separate job with `contents: write` verifies artifacts and creates the GitHub Release with .deb, checksums and notes. It uses scoped GITHUB_TOKEN; no personal token is part of the app. Actions and release writes must be allowed by the repository.

Check Actions after pushing: a tag alone is not proof of publication. Fix failed automation and rerun only if nothing was published; never silently replace assets. The publish job fails if a release already exists. If Actions/API access is unavailable, report release publication as pending even if source/tag pushed successfully.

A maintainer with CLI access can publish already-validated files with `gh release create v0.1.0 --verify-tag --prerelease --title "FocusFlow v0.1.0 (Preview)" --notes-file dist/RELEASE_NOTES.md dist/*.deb dist/SHA256SUMS` after the same checks.

## After publication

Verify labels, notes, downloads and SHA-256. Record build logs and put later changes under `[Unreleased]`. No auto-update server, signing key or deployment outside GitHub is configured.
