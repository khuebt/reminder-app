# Security

The 0.1.x series is a preview, without an established long-term support policy. Fixes ship as new preview versions; use the newest release after reading its changelog.

The app loads bundled local HTML and keeps context isolation and normal-launch Chromium sandboxing enabled. It needs no remote service or credentials. Task files have restrictive permissions but are not encrypted; software with access to your user account can read them. Release checksums are not independent signatures.

Use GitHub's **Report a vulnerability** if the owner enables private reporting. If unavailable, open an issue requesting a private contact channel without publishing exploit details or private data. This commit does not configure private reporting or promise a response SLA.

Never send an unredacted task database. Include application/Ubuntu versions, desktop/session and reproduction steps.
