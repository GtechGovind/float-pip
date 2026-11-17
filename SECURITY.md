# Security policy

## Supported versions

Security fixes currently target the latest 1.x source release. Store updates may be delayed by browser-store review; see the release notes and your installed version.

## Report a vulnerability

Use this repository's **Security → Report a vulnerability** option, or email **govind.csae@gmail.com** with the subject `Float PiP security report`.

Include the affected version, browser/OS, reproduction steps and impact. Send the smallest demonstration needed. Do not include real credentials, personal browsing information or paid video content. Please report vulnerabilities privately rather than through public issues.

The maintainer will investigate and coordinate a fix and disclosure where appropriate. This volunteer project does not guarantee response times or offer a paid bug bounty.

## Security design

Executable code is bundled and readable. The extension requests only `activeTab` and `scripting`, and uses temporary tab access after invocation. It has no persistent host access, analytics, background worker or remote executable code. See [the privacy policy](https://qurkos.com/float-pip/privacy/).
