# Deploy Drevan to DigitalOcean

Follow the milestones in order. At each checklist, stop if a check fails. Resolve it and repeat the check before moving on. The first deployment and update use your Mac and the Droplet directly. The [roadmap](../planning/roadmap.md#alpha-deployment-gates) defines when each deployment gate closes.

## Before You Begin

You need a Mac with a working Drevan checkout, access to the GitHub repository, a DigitalOcean account with MFA, a Tailscale account, and an iOS or Android phone. This walkthrough uses one Ubuntu 24.04 LTS x64 Droplet. Review its monthly price before you create it. The private HTTPS address comes with Tailscale. Choose an encrypted backup destination on your Mac or an encrypted external drive and confirm you can read it again. [DigitalOcean pricing](https://www.digitalocean.com/pricing/droplets) · [Tailscale free plans](https://tailscale.com/docs/account/manage-plans/free-plans-discounts)

**Gate 1 comes first.** The current app uses in-memory sessions, lacks an explicit loopback bind, and lets signed-in players use the self-editing Admin portal. Before following the live deployment steps, ship and verify a release that binds to loopback, persists sessions across restart, handles secure cookies behind Serve, and restricts Admin on the server. The walkthrough uses `HOST` and `SESSION_DB_PATH` as proposed names for that release. Confirm the actual names, session storage path, initialization procedure, and proxy settings against the Gate 1 release and reconcile the examples before running them. Test the behavior with disposable data and verify the project checks and player-facing changes. [Launch architecture](../planning/launch-architecture.md#application-readiness-and-operations)

**Run on your Mac**, in your Drevan checkout.

```sh
nvm use
node --version
yarn --version
yarn check
yarn build
git status --short
git rev-parse HEAD
```

`.nvmrc` and `package.json` pin Node and Yarn. The examples currently use Node 26.13.1 and Yarn 4.18.1. If Corepack or Yarn is missing, follow [local setup](getting-started.md#run-drevan-locally). Record the full Git commit ID and confirm it is on your approved GitHub branch. The guide calls that branch `main`. Substitute the real name throughout if it differs. Replace uppercase example values such as `DROPLET_IP`, `OWNER/REPO`, `FIRST_SHA`, and `SERVE_HOSTNAME` before running commands. Quoted shell variables such as `"$FIRST_SHA"` expand to the value you assigned in that terminal.

**Verification checklist**

- [ ] The selected release satisfies Gate 1 and its runtime settings are confirmed against the release.
- [ ] Checks and build pass with the pinned tools. The approved commit is in GitHub and its full ID is recorded.

You now have a vetted release to deploy and know the accounts and devices you will use.

## Understanding What You Are Building

A **Droplet** is a rented virtual machine. It has its own disk, operating system, processes, and network interfaces. An **interface** is an entry and exit point for network traffic. This server has an interface for cloud networking, a loopback interface for talking to itself, and a virtual Tailscale interface once enrolled. An **IP address** identifies a destination on a network. Public addresses are routable across the internet. Private addresses are reachable only within networks that route them, such as a cloud VPC or your Tailscale network.

**IPv4** uses four numbers separated by dots, as in `203.0.113.10`. **IPv6** uses hexadecimal groups separated by colons, as in `2001:db8::10`. These are example addresses. Each protocol has its own routes and firewall coverage. A **port** selects a service at an address. This guide uses 22 for SSH, 443 for HTTPS and 3000 for Node. **Binding** chooses which local addresses and port a process listens on. Binding to `127.0.0.1:3000` allows connections from that machine. A wildcard bind such as `0.0.0.0:3000` accepts traffic on all IPv4 interfaces if the firewall allows it.

| Address                                  | What it reaches                                                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `localhost:3000` on your Mac             | A process on your Mac, such as `yarn dev`. `localhost` resolves to loopback, usually `127.0.0.1` for IPv4 or `::1` for IPv6. |
| `127.0.0.1:3000` on the Droplet          | The deployed Node process, reachable from that Droplet and its local proxy.                                                  |
| Droplet public IPv4                      | The public interface. Initially only SSH from your approved source can enter.                                                |
| Droplet Tailscale IP such as `100.x.y.z` | A destination inside the private tailnet. Open the Serve hostname over HTTPS so the certificate matches.                     |
| Future `play.example.com`                | A name that can point to the public proxy whenever you launch a public site.                                                 |

When you enter `localhost` on your phone, it refers to the phone's own loopback interface. Each machine has its own. An **inbound** connection starts elsewhere and reaches the Droplet, such as SSH from your Mac. An **outbound** connection starts on the Droplet, such as Git fetching from GitHub. A **firewall** applies rules to traffic. The DigitalOcean firewall protects public access. Tailscale grants authorize connections within the tailnet.

A **domain registrar** registers names such as `example.com`. A **subdomain** is a name beneath one, such as `play.example.com`. **DNS** looks up information about names. An `A` record maps a name to an IPv4 address and an `AAAA` record maps it to IPv6. The application runs on the Droplet and DNS supplies an address to reach it. An SSH client can use an IP directly, and Tailscale supplies its own DNS hostname for this alpha, so a server can operate with no domain registration of your own.

**HTTP** carries requests and responses. **HTTPS** adds TLS to authenticate the server and encrypt the exchange. The browser checks that the server's certificate covers the URL's name or IP, is current, and chains to a certificate authority the browser trusts. A **reverse proxy** accepts the browser's connection and forwards the request to a local backend. Here the browser speaks HTTPS to Serve and Serve forwards to Node over Droplet loopback. A **VPN** such as Tailscale creates a private encrypted network across existing internet connections. VPN membership and policy control who can reach Serve. TLS gives the browser its own server identity and a secure origin for cookies. Drevan credentials then identify the player.

**Verification checklist**

- [ ] You can identify which address your browser, SSH client, and the Droplet's local health check will use.
- [ ] You can trace a phone request through the VPN and Serve to the app, and explain why the phone's loopback stays on the phone.

You now know which network boundaries the setup should enforce.

## Creating Your First DigitalOcean Droplet

1. **Run on your Mac.** Create an SSH key pair for administration and choose a passphrase. The `.pub` file is safe to upload. Keep the private counterpart on the Mac. If the file already exists, reuse the intended key or pick a different filename.

   ```sh
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   ssh-keygen -t ed25519 -f ~/.ssh/drevan_alpha -C drevan-alpha-operator
   cat ~/.ssh/drevan_alpha.pub
   ```

2. **In the DigitalOcean control panel**, choose **Create Droplet**. Pick a nearby region, Ubuntu 24.04 LTS x64, and a shared-CPU Basic plan around 2 GiB. Name it `drevan-alpha`, select SSH-key authentication, and add the public key. Check the quote and optional add-ons before creating. The walkthrough uses separately copied SQLite backups. Record its public IPv4 and leave IPv6 off for this walkthrough. [Create a Droplet](https://docs.digitalocean.com/products/droplets/how-to/create/)
3. **In the DigitalOcean control panel**, attach a Cloud Firewall to the Droplet, with inbound TCP 22 allowed only from your Mac network's current public IPv4 as a single-address `/32`. Use the public WAN address shown by your router or another trusted source, since the Mac's Wi-Fi address is usually private. Allow outbound traffic for package repositories, GitHub, DNS, and Tailscale. Delete broad inbound starter rules. Keep inbound 80, 443, and 3000 closed on the public network. If SSH later times out after your network changes, update the allowed source in DigitalOcean. [Create a Cloud Firewall](https://docs.digitalocean.com/products/networking/firewalls/how-to/create/)

**Verification checklist**

- [ ] The control panel shows the active Droplet, public IPv4, and selected SSH key.
- [ ] The firewall is attached and only your approved IPv4 source can open public TCP 22.

You now have a server with a narrowly scoped public management entry point.

## Connecting to Your Server for the First Time

SSH opens an encrypted remote shell. In the DigitalOcean control panel, open the Droplet's web console and run `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the Droplet to display its Ed25519 fingerprint. If the console cannot open through the restricted network, use DigitalOcean's out-of-band Recovery Console procedure to obtain the fingerprint. On the first SSH connection from your Mac, compare its displayed fingerprint with the value you recorded. Accept the matching key. If a previously saved key changes, verify the machine and reason for the change first. [DigitalOcean console access](https://docs.digitalocean.com/products/droplets/how-to/connect-with-console/) · [Recovery Console](https://docs.digitalocean.com/products/droplets/how-to/recovery/recovery-console/)

**Run on your Mac**

```sh
ssh -i ~/.ssh/drevan_alpha root@DROPLET_IP
```

**Run on your DigitalOcean Droplet** in that SSH terminal.

```sh
hostname
whoami
pwd
cat /etc/os-release
```

Expect `drevan-alpha`, `root`, `/root`, and Ubuntu 24.04. Run the first three commands in a separate Mac tab to compare. `exit` closes the remote shell and returns the tab to your Mac. For a timeout check the IP and Cloud Firewall. For `Permission denied (publickey)` check the selected private key, username, and which public key was installed.

### Shell basics you will use

- An **absolute path** begins at the filesystem root, as in `/srv/drevan`. A **relative path** begins at the current directory, as in `./data/game.sqlite`. `pwd` prints the current directory. `~` means your current user's **home directory** and changes when the user or machine changes.
- **Hidden files** start with a dot. Use `ls -la` to see them. **Ownership** names the user and group that control a file. **Permissions** decide who can read, write, and execute it. A directory also needs execute permission to be traversed. `chmod 600` lets only the owner read and write a regular file. `sudo` runs a command with the permitted elevated identity.
- A **symbolic link** is a filesystem pointer. `current` points to a release, and each release's `data` points to shared storage. `readlink -f` prints the resolved path.
- An **environment variable** is a named value a process can read. `export` makes it available to child commands in this shell. Close the session and shell variables disappear. A **configuration file** saves settings for future runs. systemd reads its own environment file at startup.
- Commands write results to **standard output** and diagnostics to **standard error**. The **exit code** is a number that tells the shell whether the command succeeded. Run `echo $?` immediately afterward to see it. Zero generally means success. Check both the exit code and any expected output, such as SQLite's `ok`.
- A **background service** keeps running after you close SSH. systemd manages its startup, restarts, and logs. To edit a file with nano, open `nano PATH` or `sudo nano PATH`, edit, press **Ctrl+O** then **Enter** to save, and press **Ctrl+X** to exit.

**Verification checklist**

- [ ] The SSH fingerprint matches the one independently obtained from the Droplet.
- [ ] The server shell shows Ubuntu 24.04 and you can distinguish it from a Mac shell.

You now have verified terminal access to the intended server.

## Preparing and Securing Your Server

1. **Run on your DigitalOcean Droplet** in the first root session. Create a named administrator and copy the public-key authorization. `adduser` prompts for a password for local administration and `sudo`. Use a strong one. Keep the original terminal open while testing. [Ubuntu OpenSSH configuration](https://ubuntu.com/server/docs/how-to/security/openssh/)

   ```sh
   adduser operator
   usermod -aG sudo operator
   install -d -m 700 -o operator -g operator /home/operator/.ssh
   install -m 600 -o operator -g operator /root/.ssh/authorized_keys /home/operator/.ssh/authorized_keys
   ```

2. **Run on your Mac**, in a second tab, `ssh -i ~/.ssh/drevan_alpha operator@DROPLET_IP`. **On the Droplet** in that session, run `sudo -v`. After it succeeds, use `sudo nano /etc/ssh/sshd_config.d/00-drevan.conf` and enter the following. This allows key-based login and closes remote root and password login.

   ```text
   PermitRootLogin no
   PubkeyAuthentication yes
   PasswordAuthentication no
   KbdInteractiveAuthentication no
   ```

   **Run on your DigitalOcean Droplet**

   ```sh
   sudo sshd -t
   sudo sshd -T | grep -E 'permitrootlogin|pubkeyauthentication|passwordauthentication|kbdinteractiveauthentication'
   sudo systemctl reload ssh
   ```

   Check syntax and the effective settings before reload. Open another operator connection and confirm `sudo -v` again before closing the original root session. If new logins fail, use the still-open session or verified recovery console to repair ownership, permissions, or the SSH configuration.

3. **Run on your DigitalOcean Droplet** as `operator`. Refresh Ubuntu's package listings and security updates. Install Git for releases, SQLite for checks and snapshots, curl for downloads and health probes, OpenSSL for the session secret, nano for editing, and the compiler and Python in case a native dependency must build.

   ```sh
   sudo apt update
   sudo apt upgrade
   sudo apt install git sqlite3 curl ca-certificates openssl gnupg nano build-essential python3 xz-utils
   git --version
   sqlite3 --version
   uname -m
   ```

   Expect `x86_64`. Read the package prompts and reboot if Ubuntu reports `/var/run/reboot-required`. If downloads fail, check outgoing connectivity and DNS with `getent hosts archive.ubuntu.com` and retry.

4. **Run on your DigitalOcean Droplet.** Install the project-pinned Node in a system-wide directory so the service account and operator use the same executable. Use the verified release archive for your OS and CPU. Replace `26.13.1` if the intended commit pins a different version. The temporary directory keeps this download separate. Fetch the archive and manifest, verify the manifest using the Node project's published signing procedure, then run the checksum check before extracting. [Node binary verification](https://github.com/nodejs/node#verifying-binaries)

   ```sh
   NODE_VERSION=26.13.1
   NODE_ARCHIVE="node-v${NODE_VERSION}-linux-x64"
   DOWNLOAD_DIR=$(mktemp -d)
   cd "$DOWNLOAD_DIR"
   curl -fLO "https://nodejs.org/dist/v${NODE_VERSION}/${NODE_ARCHIVE}.tar.xz"
   curl -fLO "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt"
   curl -fLO "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt.sig"
   ```

   After importing and verifying the Node release keys using the linked instructions, verify the detached signature with `gpg --verify SHASUMS256.txt.sig SHASUMS256.txt`. Expect a good signature from a trusted release key and `OK` from the archive checksum below. A mismatch or unexplained signing error means stop and verify the release files. Extract the verified archive and add a stable path for the service. On this fresh machine `/opt/drevan-node` should be absent before creating the link.

   ```sh
   sha256sum --check --ignore-missing SHASUMS256.txt
   sudo tar -xJf "${NODE_ARCHIVE}.tar.xz" -C /opt
   sudo ln -s "/opt/$NODE_ARCHIVE" /opt/drevan-node
   export PATH="/opt/drevan-node/bin:$PATH"
   node --version
   sudo env PATH="/opt/drevan-node/bin:/usr/bin:/bin" npm install --global corepack
   sudo env PATH="/opt/drevan-node/bin:/usr/bin:/bin" corepack enable --install-directory /opt/drevan-node/bin yarn
   ```

   Node 26 needs Corepack installed separately. Its shim uses the project `packageManager` value once you run Yarn inside a release. Add `export PATH="/opt/drevan-node/bin:$PATH"` to `~/.profile` with nano so future operator logins find it. Check `command -v node` in a new shell. If the command points elsewhere, check the profile and use the same export in that shell. [Corepack in Node.js](https://nodejs.org/download/release/v25.8.0/docs/api/corepack.html)

**Verification checklist**

- [ ] A new operator login works with the Mac key and can use `sudo`. SSH's effective config disallows remote root and password authentication.
- [ ] Updated Ubuntu packages and tools are present, and the pinned Node version is available from `/opt/drevan-node/bin`.
- [ ] The DigitalOcean firewall still allows only the approved public SSH source.

The Droplet now has the operator access and tools needed to deploy Drevan.

## PERFORMING YOUR FIRST DEPLOYMENT

Begin only after the previous checklists pass. In the shell blocks below, run each line after its predecessor succeeds. The release will use a dedicated `drevan` service account and keep persistent files separate from Git.

### 1. Reconnect and establish the directories

**Run on your Mac**

```sh
ssh -i ~/.ssh/drevan_alpha operator@DROPLET_IP
```

**Run on your DigitalOcean Droplet**

```sh
hostname
whoami
export PATH="/opt/drevan-node/bin:$PATH"
node --version
git --version
sqlite3 --version
sudo useradd --system --no-create-home --shell /usr/sbin/nologin drevan
sudo install -d -m 0755 -o operator -g operator /srv/drevan /srv/drevan/releases
sudo install -d -m 0750 -o drevan -g drevan /srv/drevan/shared
sudo install -d -m 0700 -o operator -g operator /srv/drevan/backups
sudo install -d -m 0700 /etc/drevan
ls -ld /srv/drevan /srv/drevan/*
getent passwd drevan
```

Expect the pinned Node version and the `operator` shell. The operator owns the release directories and reads backups. The app identity can write `shared/` for both SQLite files and their sidecars, and read the release files. `/etc/drevan` is root-owned and holds service settings. If the account already exists, verify that it is the intended non-login account. Correct the specific owner or mode if a path is inaccessible. Keep the release trees readable by `drevan` and the state directory private.

### 2. Fetch the exact release from GitHub

**Run on your DigitalOcean Droplet**

For a public repository use `https://github.com/OWNER/REPO.git` as `REPO_URL`. For a private repository generate a dedicated key with `ssh-keygen -t ed25519 -f ~/.ssh/drevan_repo -C drevan-alpha-read`. Add the `.pub` file under **Settings → Deploy keys** in the repository with write access unchecked. Verify GitHub's host fingerprint on first use. If you set a passphrase, use an SSH agent (`eval "$(ssh-agent -s)"`, then `ssh-add ~/.ssh/drevan_repo`) and unlock the key in this operator session. The agent keeps the key available for Git through the session. Copy only the public key to GitHub. [GitHub deploy keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) · [GitHub host fingerprints](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints)

For the private repository path, these values select the Git credential and remote. For the public path set `REPO_URL` to the HTTPS URL and skip `GIT_SSH_COMMAND`.

```sh
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/drevan_repo -o IdentitiesOnly=yes"
REPO_URL=git@github.com:OWNER/REPO.git
```

```sh
FIRST_SHA=PASTE_FIRST_COMMIT_ID
RELEASE="/srv/drevan/releases/$FIRST_SHA"
umask 022
git clone --no-checkout "$REPO_URL" /srv/drevan/repo
git -C /srv/drevan/repo merge-base --is-ancestor "$FIRST_SHA" origin/main
git -C /srv/drevan/repo worktree add --detach "$RELEASE" "$FIRST_SHA"
cd "$RELEASE"
git rev-parse HEAD
cat .nvmrc
```

The clone holds Git history. A worktree gives the chosen commit a separate directory, and `--detach` keeps it independent of branch movement. `umask 022` gives release files readable defaults. The ancestry check exits silently with status zero when the commit is on the approved branch. Stop on failure and confirm the pushed SHA and branch. A repository error usually means the URL or read key is wrong. If a release directory already exists, inspect it before retrying and keep any active release intact.

### 3. Install locked dependencies and build

**Run on your DigitalOcean Droplet**, in `"$RELEASE"`.

```sh
node --version
yarn --version
yarn install --immutable
yarn build
ls -ld dist/app.js src/views public drizzle
```

Match `.nvmrc` and the Yarn version in `package.json`. Corepack may download Yarn on first use. `--immutable` refuses changes to the lockfile. TypeScript compiles to `dist/` and Sass builds the stylesheet in `public/`. Keep the templates and migration files in the release. If a native module install fails, read Yarn's build log and check the compiler, Python, architecture, and pinned Node version. If the lockfile is inconsistent, fix and validate it on the Mac and deploy the corrected commit.

### 4. Create private settings and attach shared storage

**Run on your DigitalOcean Droplet**

```sh
sudo install -m 0600 /dev/null /etc/drevan/drevan.env
openssl rand -hex 32
sudo nano /etc/drevan/drevan.env
```

The first command creates an empty settings file. Use it only on the first setup. The second prints a random secret in your private SSH session. Paste it for `SESSION_SECRET`. Keep it out of shell commands, Git, screenshots, and logs. Use the confirmed Gate 1 settings if the proposed names differ.

```ini
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
SESSION_SECRET=PASTE_RANDOM_HEX_HERE
DATABASE_URL=/srv/drevan/shared/game.sqlite
SESSION_DB_PATH=/srv/drevan/shared/sessions.sqlite
```

**Run on your DigitalOcean Droplet**

```sh
ln -s /srv/drevan/shared "$RELEASE/data"
readlink -f "$RELEASE/data"
sudo stat -c '%U %a %n' /etc/drevan/drevan.env
sudo -u drevan test -w /srv/drevan/shared
sudo ls -la /srv/drevan/shared
```

Expect `/srv/drevan/shared`, `root 600` for the settings file, and an empty shared directory on the first deployment. The app and seed resolve `./data/game.sqlite` relative to the release. Drizzle uses the absolute `DATABASE_URL`. Both paths must reach the same file. This guide assumes the separate session database is created by the verified session-store implementation at startup. If it requires its own initialization, run that release's procedure before starting the service. If a database already exists, use the update and backup procedure. If the link cannot be created because `data` exists, inspect it before moving anything.

### 5. Apply checked-in migrations and seed the first catalog

**Run on your DigitalOcean Droplet**, in `"$RELEASE"`.

```sh
sudo -u drevan mkdir -p /srv/drevan/shared/.corepack
sudo -u drevan env PATH="/opt/drevan-node/bin:/usr/bin:/bin" COREPACK_HOME=/srv/drevan/shared/.corepack DATABASE_URL=/srv/drevan/shared/game.sqlite yarn db:migrate
sudo -u drevan env PATH="/opt/drevan-node/bin:/usr/bin:/bin" COREPACK_HOME=/srv/drevan/shared/.corepack yarn db:seed
sudo -u drevan sqlite3 -readonly /srv/drevan/shared/game.sqlite '.tables'
sudo -u drevan sqlite3 -readonly /srv/drevan/shared/game.sqlite "SELECT name FROM items WHERE name = 'Lesser Potion';"
```

Migrations create the game tables and record which versions ran. The seed loads the initial item catalog. Both commands use the app identity so it owns the resulting database. `COREPACK_HOME` gives that account a private Yarn cache since it has no home directory. Expect successful migration output, `Database seeded!`, the game tables, and `Lesser Potion`. If a table is missing, check the working directory, link, and migration path first. If Yarn cannot access the cache or SQLite reports read-only, check ownership and directory access. Use the tracked migrations for deployment. Avoid `db:push`, which bypasses migration history. [Database development](database.md)

### 6. Set up and start the service

**Run on your DigitalOcean Droplet**

```sh
ln -s "$RELEASE" /srv/drevan/current
sudo nano /etc/systemd/system/drevan.service
```

Use this unit, which tells systemd how to run the service. `WorkingDirectory` affects where relative database paths resolve. `ExecStart` names the real Node binary instead of depending on a login shell. `UMask` makes files created by the process private by default. `Restart` restarts a process that exits with an error, and the install section makes boot startup possible.

```ini
[Unit]
Description=Drevan alpha
After=network.target

[Service]
Type=exec
User=drevan
Group=drevan
WorkingDirectory=/srv/drevan/current
EnvironmentFile=/etc/drevan/drevan.env
ExecStart=/opt/drevan-node/bin/node /srv/drevan/current/dist/app.js
Restart=on-failure
RestartSec=3
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

**Run on your DigitalOcean Droplet**

```sh
sudo systemd-analyze verify /etc/systemd/system/drevan.service
sudo systemctl daemon-reload
sudo systemctl enable --now drevan
sudo systemctl status drevan --no-pager
sudo journalctl -u drevan -n 30 --no-pager
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
sudo ss -ltnp 'sport = :3000'
sudo -u drevan ls -l /srv/drevan/shared
```

`daemon-reload` tells systemd to read the new unit. Enablement starts Drevan on future boots and `--now` starts it now. Expect `active (running)`, HTTP `200`, and a listener on `127.0.0.1:3000` alone. The main page check exercises the HTTP server and template rendering. If the service just started and the connection is refused, retry briefly and check the journal if it keeps failing. Login and gameplay below exercise the database. Confirm the session store's file appears at startup or after first login according to its implementation. Inspect the journal if the service exits. A missing JavaScript file usually means the build or current link is wrong. A missing secret or permission error points to the settings file or shared directory. If the listener is on a wildcard address, stop the service and correct the Gate 1 release or settings before continuing. Use loopback HTTP only for local health probes.

### 7. Enroll the server and publish private HTTPS

**In the Tailscale admin console**, enable MagicDNS and HTTPS Certificates under **DNS**. Choose neutral server and tailnet names because the certificate hostname appears in public certificate transparency logs. Enable device approval where available. Under **Access controls**, set up the following policy for a dedicated Drevan tailnet. In an existing tailnet, merge only the Drevan rules and review any existing grants and ACLs that could also permit access. Replace both example addresses with the operator's real Tailscale login. The initial group has just you. Add exact tester identities after the operational gate. `tagOwners` names who may assign the server tag. The grant permits TCP 443 to that tag from the player group. Remove the starter allow-all rule from a dedicated tailnet. [Tailscale HTTPS setup](https://tailscale.com/docs/how-to/set-up-https-certificates) · [Tailscale grants](https://tailscale.com/docs/features/access-control/grants) · [Tailscale tags](https://tailscale.com/docs/features/tags)

```json
{
  "groups": { "group:drevan-alpha": ["owner@example.com"] },
  "tagOwners": { "tag:drevan-alpha": ["owner@example.com"] },
  "grants": [
    {
      "src": ["group:drevan-alpha"],
      "dst": ["tag:drevan-alpha"],
      "ip": ["tcp:443"]
    }
  ]
}
```

**Run on your DigitalOcean Droplet.** Download the Ubuntu 24.04 package signing key and repository definition. Install the key where the definition expects it, then install the package with APT so Ubuntu can pick up future updates. [Tailscale stable Ubuntu packages](https://pkgs.tailscale.com/stable/)

```sh
cd ~
curl -fLo tailscale-noble.gpg https://pkgs.tailscale.com/stable/ubuntu/noble.noarmor.gpg
curl -fLo tailscale-noble.list https://pkgs.tailscale.com/stable/ubuntu/noble.tailscale-keyring.list
sudo install -m 0644 tailscale-noble.gpg /usr/share/keyrings/tailscale-archive-keyring.gpg
sudo install -m 0644 tailscale-noble.list /etc/apt/sources.list.d/tailscale.list
sudo apt update
sudo apt install tailscale
sudo systemctl enable --now tailscaled
sudo tailscale up --hostname=drevan-alpha --advertise-tags=tag:drevan-alpha
tailscale status
sudo tailscale serve --bg http://127.0.0.1:3000
tailscale serve status
```

Open the enrollment URL on your Mac, sign in to the intended tailnet as an authorized tag owner, and approve the device if prompted. After `tailscale up` succeeds, Serve in background mode persists across restarts. Record the full `https://…ts.net` URL from Serve and confirm the status says it is available within the tailnet. Use Serve with the public Cloud Firewall still closed on 80, 443, and 3000. If certificate setup fails, check DNS and HTTPS settings, outbound connectivity, system time, and the tag. If you see a 502 after enrollment, check loopback health and the Serve target. [Serve CLI](https://tailscale.com/docs/reference/tailscale-cli/serve) · [Tailscale firewall requirements](https://tailscale.com/docs/reference/faq/firewall-ports)

### 8. Verify access on your Mac

Install Tailscale on your Mac, sign in to the intended tailnet, and approve the device. Open the Serve URL. **Run on your Mac** to test browser-trusted HTTPS independently of the browser UI. Substitute the hostname printed by Serve.

```sh
curl -fsS -o /dev/null -w '%{http_code}\n' https://SERVE_HOSTNAME/
```

Expect `200` and an ordinary login page in the browser without a certificate warning. If DNS fails, verify the client is connected and the URL is the complete Serve hostname. If it times out, check device approval and the grant. If the browser reports a certificate error, fix it before entering a password.

**Verification checklist**

- [ ] `current` points to the expected commit. The runtime opens shared persistent game and session storage using the confirmed Gate 1 settings.
- [ ] Drevan is enabled and running. Its local page returns HTTP 200 and the Node listener is loopback-only.
- [ ] The enrolled Mac reaches the login page over private, trusted HTTPS and public web ports remain closed.

The release is installed and works from your Mac. Finish the [phone, sign-in, and restart checks](#accessing-drevan-from-your-phone) to close Gate 3.

## Accessing Drevan From Your Phone

1. **On your phone**, install Tailscale from the App Store or Google Play. Sign in to the same tailnet, allow the OS to add a VPN profile, and approve the device in the admin console if required. If the phone already uses another VPN, check whether that profile must be paused. Open the recorded Serve HTTPS URL in Safari or Chrome. Repeat on cellular to check that the connection works away from your home Wi-Fi. [Tailscale device installation](https://tailscale.com/docs/install)
2. Open **Create an account** on the login page or sign in with a dedicated alpha test account. Make a lasting game change, such as one training result or a purchase. Record the character, level or XP, gold, inventory, and relevant progress. On the Mac, sign in as the same player through the Serve URL and compare. Check that an ordinary account cannot open or submit changes to the Admin tool. Open `/game` in a private window and verify that unauthenticated users are sent to sign-in. In the Mac browser developer tools, check that the session cookie is marked Secure and HttpOnly.
3. **On a device outside the tailnet**, try opening the Serve URL. You should see a connection or DNS failure before the application responds. Repeat on your phone after disconnecting Tailscale and leaving Wi-Fi off, then reconnect. **Run on your Mac** and replace `DROPLET_IP` to check the public route. These requests should fail to connect even from the allowed SSH source.

   ```sh
   curl --connect-timeout 5 http://DROPLET_IP:3000/
   curl --connect-timeout 5 http://DROPLET_IP/
   curl --connect-timeout 5 https://DROPLET_IP/
   ```

   If any of these connect, review the listener and Cloud Firewall before continuing. If the connected phone sees a timeout or certificate error, check the VPN connection, tailnet membership, grant, and full hostname first.

4. **Run on your DigitalOcean Droplet** to restart just Drevan.

   ```sh
   sudo systemctl restart drevan
   sudo systemctl is-active drevan
   curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
   ```

   Refresh the signed-in phone tab. Expect the session and saved player state to survive. Then **run on your DigitalOcean Droplet** `sudo systemctl reboot`. Reboot disconnects SSH briefly. Reconnect **from your Mac** as `operator`, then **run on your DigitalOcean Droplet** the following.

   ```sh
   sudo systemctl is-active drevan tailscaled
   tailscale serve status
   curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
   ```

   Refresh the signed-in tab again and compare the saved values. If either service fails after reboot, check enablement and use `sudo journalctl -b -u drevan -u tailscaled` for this boot. If the app works but the session is lost, check the confirmed session path and whether the secret changed. Resolve these before closing Gate 3.

5. After Gate 6, invite testers one at a time through the Tailscale admin console and send them the private Serve URL. Add their exact Tailscale identities to `group:drevan-alpha`, approve their devices, and have them repeat the HTTPS and game login checks. They need only ordinary tailnet membership and TCP 443. When removing access, remove the identity from the group and revoke its tailnet membership or devices as appropriate. [Invite users](https://tailscale.com/docs/features/sharing/how-to/invite-any-user)

**Verification checklist**

- [ ] The Mac and phone reach HTTPS, and an unenrolled device cannot reach the site. Public web ports and port 3000 are closed.
- [ ] The alpha player can log in and save progress. Authentication, secure cookies, and Admin restrictions work.
- [ ] The player remains signed in with the same saved state across both a service restart and a reboot.

Gate 3 is complete when these checks pass. You can play privately on your own devices. Keep external invitations for after Gate 6.

## PERFORMING YOUR FIRST MANUAL UPDATE

An update replaces the release the service runs. Existing accounts, sessions, and game state live under `shared/` and the secret stays in `/etc/drevan`. Deleting the application tree and rebuilding it with a fresh database would discard those records. Keep the previous release and use a backup to protect data during any migration.

### 1. Make and publish a change you can recognize

**Run on your Mac** in your checkout. For the exercise, edit a harmless line of login-page copy in the relevant template, and make no schema, runtime, catalog, or session changes. Note the exact text before and after. Run `nvm use`, `yarn check`, `yarn test:a11y` and `yarn build`. Review the diff, commit the template change, and push or merge it through your normal branch process. Leave Git hooks enabled. [Contributor workflow](workflow.md)

Once the code is merged, **run on your Mac** `git fetch origin` then `git log -1 --oneline origin/main` and `git rev-parse origin/main`. Confirm the commit on the approved branch includes the expected change and record the full SHA. If a merge changes the commit ID, deploy the merged commit.

### 2. Build the candidate alongside the live release

**Run on your Mac**

```sh
ssh -i ~/.ssh/drevan_alpha operator@DROPLET_IP
```

**Run on your DigitalOcean Droplet**

```sh
export PATH="/opt/drevan-node/bin:$PATH"
NEXT_SHA=PASTE_UPDATE_COMMIT_ID
NEXT_RELEASE="/srv/drevan/releases/$NEXT_SHA"
PREVIOUS_RELEASE=$(readlink -f /srv/drevan/current)
printf '%s\n' "$PREVIOUS_RELEASE"
git -C "$PREVIOUS_RELEASE" rev-parse HEAD
```

For a private repo, load the same read-only deploy key from the first deployment in this SSH session and set `GIT_SSH_COMMAND` as before. Then **run on your DigitalOcean Droplet**.

```sh
umask 022
git -C /srv/drevan/repo fetch origin
git -C /srv/drevan/repo merge-base --is-ancestor "$NEXT_SHA" origin/main
git -C /srv/drevan/repo worktree add --detach "$NEXT_RELEASE" "$NEXT_SHA"
cd "$NEXT_RELEASE"
cat .nvmrc
node --version
yarn --version
yarn install --immutable
yarn build
ln -s /srv/drevan/shared "$NEXT_RELEASE/data"
readlink -f "$NEXT_RELEASE/data"
```

Compare the two commits before touching production data.

```sh
PREVIOUS_SHA=$(git -C "$PREVIOUS_RELEASE" rev-parse HEAD)
git diff --name-status "$PREVIOUS_SHA" "$NEXT_SHA"
```

Expect the new commit to build and the diff for this exercise to show only the intended copy change. Review migration, schema, and seed diffs on real updates and test any change against a disposable restored snapshot first. Confirm tool versions before installation. Plan and test a separately staged runtime upgrade if `.nvmrc` changes. The currently running release should continue to serve while you build. If the candidate build fails, fix it on your Mac and repeat with the corrected commit.

### 3. Stop writes and make a consistent backup

Schedule a short maintenance window so testers know when the site will be unavailable. Stop Drevan to freeze game and session writes. The SQLite `.backup` command produces a consistent snapshot, including committed changes still in a write-ahead log. Use a fresh timestamped backup directory and keep it private. [SQLite command-line shell](https://www.sqlite.org/cli.html)

**Run on your DigitalOcean Droplet**

```sh
sudo systemctl stop drevan
sudo systemctl is-active drevan
BACKUP_DATE=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_DIR=$(mktemp -d "/srv/drevan/backups/${BACKUP_DATE}-XXXXXXXX")
sudo test -s /srv/drevan/shared/game.sqlite
sudo sqlite3 -readonly /srv/drevan/shared/game.sqlite ".backup '$BACKUP_DIR/game.sqlite'"
sudo chown operator:operator "$BACKUP_DIR/game.sqlite"
chmod 600 "$BACKUP_DIR/game.sqlite"
printf '%s\n' "$PREVIOUS_SHA" > "$BACKUP_DIR/release.txt"
sqlite3 -readonly "$BACKUP_DIR/game.sqlite" 'PRAGMA integrity_check;'
printf '%s\n' "$BACKUP_DIR"
```

After a stop, `is-active` prints `inactive` and returns a nonzero exit code. Expect `ok` from the integrity check. This procedure backs up durable game data. Normal updates retain the existing session store, while disaster recovery uses new sessions and players sign in again. Keep the secret in a separate password manager if you need it for rebuilds, and generate a fresh one when recovering from suspected compromise. If backup fails, resolve disk, permissions, or SQLite errors before proceeding. If you need to restore availability at this point, restart the current release before making any schema changes.

**Run on your Mac**. Copy the backup folder to your encrypted backup location. Substitute the directory name printed above. Run the integrity check on this copy too. Both game files contain private player data.

```sh
scp -i ~/.ssh/drevan_alpha -r operator@DROPLET_IP:/srv/drevan/backups/BACKUP_FOLDER /path/to/encrypted/backups/
sqlite3 -readonly /path/to/encrypted/backups/BACKUP_FOLDER/game.sqlite 'PRAGMA integrity_check;'
```

### 4. Run reviewed migrations if required and activate the candidate

The copy-only exercise skips migrations and seed. For real releases with new tracked migrations, run the following in the **candidate release on your DigitalOcean Droplet**. Run the seed command separately, only when you reviewed a catalog change that needs it. The seed updates catalog rows and can unequip items that no longer meet level requirements. Keep the app stopped during these steps.

```sh
cd "$NEXT_RELEASE"
sudo -u drevan env PATH="/opt/drevan-node/bin:/usr/bin:/bin" COREPACK_HOME=/srv/drevan/shared/.corepack DATABASE_URL=/srv/drevan/shared/game.sqlite yarn db:migrate
```

```sh
sudo -u drevan env PATH="/opt/drevan-node/bin:/usr/bin:/bin" COREPACK_HOME=/srv/drevan/shared/.corepack yarn db:seed
```

Check the exit status and output before proceeding. A migration error requires inspecting the journal and the database with the service still stopped. Verify what committed and follow the recovery section before restarting any version that might be incompatible.

**Run on your DigitalOcean Droplet**

```sh
cd /srv/drevan
ln -s "$PREVIOUS_RELEASE" previous.next
mv -Tf previous.next previous
ln -s "$NEXT_RELEASE" current.next
mv -Tf current.next current
sudo systemctl restart drevan
sudo systemctl status drevan --no-pager
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
readlink -f current
readlink -f previous
```

The temporary links and the same-directory rename make each link switch atomic. `mv -T` treats the destination as the link itself. If a temporary link already exists, inspect the active and staged links before retrying. The app should return HTTP 200 locally, and `current` and `previous` should resolve to the candidate and former release respectively. If status is healthy but the page is wrong, verify the actual SHA and the Serve connection.

### 5. Verify player state and rehearse a release rollback

Open the Serve URL on the Mac. Confirm the new copy in a signed-out window. In your original logged-in window, confirm the same account, progression, inventory, equipment, gold, and saved activity from before the update. Your existing session should still work.

For this schema-compatible copy-only exercise, **run on your DigitalOcean Droplet** to return to the previous release.

```sh
cd /srv/drevan
ln -s "$PREVIOUS_RELEASE" current.next
mv -Tf current.next current
sudo systemctl restart drevan
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
readlink -f current
```

Look for the old copy over HTTPS and confirm the same player data. Both releases use the same schema and session format, so this rollback needs only a code switch and restart. A migration can make an older release incompatible. Switching its code does not reverse that migration. Use the recovery decision below in that case. To finish the exercise, repeat the `current.next` switch with `"$NEXT_RELEASE"`, restart, and verify the new page again. Record the current and previous SHAs with the snapshot path. That record will guide the automated version of this procedure.

**Verification checklist**

- [ ] The verified new commit is active, the expected change appears through Serve, and the previous commit is identified.
- [ ] The snapshot passes the integrity check on the Droplet and off-server. Existing gameplay data and sessions survived.
- [ ] The previous release worked against the same database during the rollback rehearsal, and the intended release is running again.

Gate 4 is complete. You now have a repeatable manual procedure to automate.

## Understanding GitHub Actions

Continuous integration (CI) checks a commit in a clean environment. Continuous deployment (CD) takes an approved, validated commit through the release steps you just performed. A **workflow** is a process definition stored in the repository under `.github/workflows/`. A **job** is a group of actions and commands run on a **runner**, a machine provided by GitHub in this plan. Step logs and exit codes tell GitHub where a run failed. [GitHub Actions concepts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)

| Manual operation           | Automated equivalent                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Select the intended commit | Checkout the triggering SHA and carry that SHA into deployment                            |
| Install dependencies       | Set up Node from `.nvmrc`, enable Corepack, run `yarn install --immutable`                |
| Validate the application   | CI job runs `yarn check` and the applicable browser checks                                |
| Build assets               | CI runs `yarn build`; the Droplet builds the same SHA with its pinned tools               |
| Connect to the Droplet     | Hosted runner joins the tailnet with its own identity and authenticates over SSH          |
| Back up the database       | Server deploy command stops writes and verifies a SQLite snapshot                         |
| Apply migrations           | Server deploy command applies reviewed migrations and seeds approved catalog changes      |
| Activate a release         | Server deploy command switches the `current` link                                         |
| Restart Drevan             | Restricted systemd operation for `drevan.service`                                         |
| Verify application health  | Local HTTP probe, running service and expected active SHA checks, then browser smoke test |

A successful CI build verifies the commit in a clean environment. The Droplet prepares its own release so native SQLite and password hashing modules match its OS, architecture, and Node installation. The deploy job sends the exact CI-validated commit, so another push cannot silently change which version goes live.

**Verification checklist**

- [ ] Both manual gates are recorded as passed.
- [ ] You can point to the manual step behind each automated operation and where its output will appear.

You now have a sequence to translate into CI and CD and know which machine performs each part.

## Configuring Your First Automated Deployment

Use this design during Gate 5, after the manual update succeeds. The documentation milestone leaves the workflow, helper, and credentials for that implementation.

1. **On GitHub**, protect `main` using the controls available to the repository and choose it as the only automatic deploy trigger. Run CI for pull requests and on pushes to `main`. Allow the deploy job only after CI for that exact `main` push succeeds. Create an `alpha` environment and scope deploy secrets and branch restrictions there where supported. Check plan and repository visibility before relying on specific protection features. A failed CI or a pull request cannot get deployment credentials. Use a single deploy concurrency group and keep `cancel-in-progress` disabled so a later push does not interrupt database work. Pin third-party actions to full commit SHAs and grant minimal token permissions. [GitHub deployment controls](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments) · [Environment availability](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) · [GitHub Actions security](https://docs.github.com/en/actions/reference/security/secure-use)
2. **In the Tailscale admin console**, add an independent `tag:drevan-ci` whose tag owners control runner identity. Add a grant from that tag to `tag:drevan-alpha` on `tcp:22` only. Keep the player grant on TCP 443. Configure Tailscale workload identity federation for GitHub Actions with the Auth Keys write scope limited to the CI tag. Restrict the federated subject to this repository and the chosen protected deployment environment or branch, as appropriate for the GitHub identity token. The deploy job needs `id-token: write` to obtain the short-lived identity. Confirm the runner appears as an ephemeral member and cannot reach the player HTTPS port. Keep the public firewall rules in place. The developer's public SSH path remains available if the automation or tailnet has an issue. [Tailscale GitHub Action](https://tailscale.com/docs/integrations/github/github-action)
3. **On your DigitalOcean Droplet**, use native OpenSSH over the Tailscale address. Set up a dedicated deployment login and SSH key for the runner, with a forced command and forwarding, interactive shell, and PTY disabled. Install the launcher in a root-owned location outside the checkout. Accept exactly one full commit SHA and require it to match the freshly fetched tip of the protected deployment branch. If a newer push has landed, report the candidate as superseded and let the newer commit pass CI before deployment. Pass the SHA as data and never evaluate shell text from the runner. If using a private GitHub repository, give the server-side release builder its own narrowly scoped read-only repository credential. A key for SSH into the Droplet and one to fetch GitHub have different purposes. Store only the deployment client key in the deploy environment and pin the Droplet host key using the verified fingerprint. Avoid generic sudo permissions, and allow only reviewed operations for this service through the helper. Anyone allowed to deploy changes what code the service runs, so review deployable commits accordingly.
4. **On your DigitalOcean Droplet**, use a server-side lock for automated deployments and use that same lock for future manual maintenance. GitHub concurrency only coordinates GitHub jobs. Prepare the candidate and confirm its revision before stopping the service. Then perform the manual backup, migration, link, restart, and health checks in order. Record the prior and intended SHA before switching. As a first automation exercise, limit deployment to changes that need no migration or seed. Have the helper stop with an actionable message for schema or catalog changes until it can handle them with reviewed migration and recovery rules. Stop and hold for operator diagnosis on a partial migration or unknown schema state. Return a nonzero exit code on failures, including a failed health check after a successful rollback. Publish release IDs, timestamps, backup identifiers, and health status to the run log without exposing keys, cookies, or database contents.
5. **Executed automatically by GitHub Actions**, the CI job checks out the triggering SHA, installs locked dependencies, validates, and builds. The deploy job joins the tailnet, checks the Droplet host key, and invokes the server-side helper over SSH with that same SHA. The helper verifies systemd status and retries the loopback HTTP probe for a bounded startup window. It exits successfully only after the candidate is active and healthy. Keep the end-to-end browser check on an authorized Mac or phone.

**Verification checklist**

- [ ] The workflow stages, exact SHA handoff, branch restrictions, and deploy secret scope have been reviewed.
- [ ] The runner can reach only the intended server SSH port via its tag. A player device allowed over the tailnet cannot open deployment SSH.
- [ ] The server accepts only the restricted deploy operation and serializes it with manual updates. Host key verification stays enabled.

The automated path can now be exercised with a harmless, schema-compatible commit.

## Verifying Your First Automated Deployment

1. **On your Mac**, prepare and validate a second visible copy-only change as in the manual exercise. Record the SHA after it lands on `main` and compare the signed-in player's XP, equipment, gold, and inventory against your baseline.
2. **On GitHub**, open the workflow run for that SHA. Confirm CI succeeded before deployment. Inspect the logged backup identifier, previous and active SHAs, restart and local health result. A green CI job alone says nothing about which release is live. [View workflow run history](https://docs.github.com/en/actions/how-tos/monitor-workflows/view-workflow-run-history)
3. **Run on your DigitalOcean Droplet** to cross-check what Actions reported.

   ```sh
   git -C /srv/drevan/current rev-parse HEAD
   readlink -f /srv/drevan/previous
   sudo systemctl is-active drevan
   curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
   ```

   Expect the merged SHA, the previous release path, `active`, and HTTP 200. **On your Mac or phone**, open Serve and confirm the new copy, existing session, and persistent game state.

4. **On GitHub**, open a test pull request with a harmless failing check on a separate branch and verify the deploy job never runs. Revert that test change or close the branch without merging it. In a disposable environment, also rehearse a bad candidate or failed health probe and verify the workflow reports failure and leaves the operator a clear recovery path. Use the logs, the live SHA, and the Troubleshooting milestone if the production candidate fails.

**Verification checklist**

- [ ] A validated push deploys the same SHA automatically and the expected game page works from an enrolled device.
- [ ] The server recorded the backup, the prior release, and the health check. Player data is still present.
- [ ] Unvalidated code cannot deploy, and a failed release reports failure.

Gate 5 now closes. GitHub Actions can repeat a verified manual procedure without relying on a player device.

## Troubleshooting and Recovering Your Application

Start with the smallest failing hop. Check whether SSH connects, the service runs, loopback responds, Serve responds, and authentication works, in that order. Record the first failing check before changing anything.

**Run on your DigitalOcean Droplet**

```sh
sudo systemctl status drevan tailscaled --no-pager
sudo journalctl -u drevan -n 60 --no-pager
sudo journalctl -u tailscaled -n 60 --no-pager
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
sudo ss -ltnp 'sport = :3000'
readlink -f /srv/drevan/current /srv/drevan/previous
df -h /srv/drevan
```

| Symptom                            | First check                                                                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public SSH times out               | Verify Droplet status, IP, your current public source, and Cloud Firewall. Use DigitalOcean recovery access if necessary.                                        |
| Service exits immediately          | Read the first error in the journal. Check the current link, Node binary, secret configuration, and DB ownership.                                                |
| Page opens locally and Serve fails | Check `tailscale status`, `tailscale serve status`, device approval, the grant, and the full hostname. A certificate warning requires a certificate or name fix. |
| New account or login fails         | Confirm the correct shared database and starter catalog, session file write permissions, and secure cookie handling through Serve.                               |
| Disk is full or SQLite is busy     | Pause deployment, inspect available space and identify other writers. Free reviewed expendable files and preserve the active release and database files.         |
| Migration stops with an error      | Keep the app stopped. Save the migration output and snapshot of the resulting state before deciding if it is safe to resume or roll back.                        |

### Decide whether to switch code or restore data

Use the manual link-switch rollback when the old code supports the database and session schema now on disk. Use a restored backup with the release SHA saved alongside it when data is corrupted, the VM was lost, or the schema cannot safely run with either available release. Restoring an older snapshot discards later writes. Before an actual production restore, obtain the maintainer's approval for the recovery point, stop Drevan and any other writers, preserve copies of the current game database and associated SQLite sidecars, and record the incident.

On a new Droplet, rebuild the OS setup, check out the backup's release, and stage the restored game file under `shared/` with owner `drevan` and mode `0600`. For an in-place recovery after approval, move the existing database and its `-wal`, `-shm`, and `-journal` files if present out of the live directory as a set before placing the recovered database there. A stale sidecar must never accompany the restored game file. Use a fresh session store and plan for players to sign in again. Confirm the secret and proxy configuration, activate the matching release, and repeat the service, HTTPS, and player checks. Only apply later migrations after the matching release works and a new snapshot exists.

### Rehearse with an off-server copy

Use a backup from the manual update and its `release.txt`. This drill creates a separate game database and separate sessions. It leaves the production service running and exposes the rehearsal on Droplet loopback only.

1. **Run on your Mac** to transfer the verified copy back into the operator home directory. Replace the encrypted backup path, folder name, and IP.

   ```sh
   scp -i ~/.ssh/drevan_alpha /path/to/encrypted/backups/BACKUP_FOLDER/game.sqlite operator@DROPLET_IP:~/drevan-recovery.sqlite
   ```

2. **Run on your DigitalOcean Droplet**. Substitute the SHA recorded next to the backup. Confirm the matching built release exists and its Git SHA matches. If needed, prepare that commit using the same worktree and build procedure without changing `current`.

   ```sh
   BACKUP_RELEASE=/srv/drevan/releases/PASTE_BACKUP_RELEASE_SHA
   git -C "$BACKUP_RELEASE" rev-parse HEAD
   chmod 600 ~/drevan-recovery.sqlite
   DRILL_DIR=$(sudo -u drevan mktemp -d /srv/drevan/shared/recovery.XXXXXXXX)
   sudo -u drevan mkdir "$DRILL_DIR/data"
   sudo install -m 0600 -o drevan -g drevan ~/drevan-recovery.sqlite "$DRILL_DIR/data/game.sqlite"
   sudo -u drevan sqlite3 -readonly "$DRILL_DIR/data/game.sqlite" 'PRAGMA integrity_check;'
   sudo -u drevan sqlite3 -readonly "$DRILL_DIR/data/game.sqlite" 'PRAGMA foreign_key_check;'
   sudo -u drevan sqlite3 -readonly "$DRILL_DIR/data/game.sqlite" 'SELECT count(*) FROM users;'
   ```

   Expect `ok`, no foreign key violations, and the expected account count at the snapshot. If the backup is unusable, try the last known-good backup, then diagnose and verify the backup process again.

3. **Run on your DigitalOcean Droplet** to start the matching build on a spare loopback port. Set the confirmed Gate 1 variables for this isolated directory. Generate an ephemeral secret and keep the service's production secret and session file out of the drill.

   ```sh
   sudo -u drevan env HOST=127.0.0.1 PORT=3001 NODE_ENV=production SESSION_SECRET="$(openssl rand -hex 32)" DATABASE_URL="$DRILL_DIR/data/game.sqlite" SESSION_DB_PATH="$DRILL_DIR/data/sessions.sqlite" /bin/sh -c 'cd "$1" && exec /opt/drevan-node/bin/node "$2/dist/app.js"' sh "$DRILL_DIR" "$BACKUP_RELEASE"
   ```

   The small shell command enters the private working directory as the service account and starts Node there. The app finds its game data using the rehearsal working directory and templates from the original build. In a second **Droplet** shell, check `sudo ss -ltnp 'sport = :3001'` for the loopback bind and run `curl -fsS http://127.0.0.1:3001/ -o /dev/null`. Confirm the snapshot's expected character values in SQLite using the schema for the backup release. If you also want to rehearse sign-in, use a separate verified private HTTPS origin for the drill. Stop the foreground process with **Ctrl+C** and securely dispose of the drill copy and transferred snapshot under your backup retention policy.

**Verification checklist**

- [ ] You can identify which hop failed using host, app, and tailnet checks.
- [ ] A copy brought back from off-server passes integrity checks and the matching code starts against it in isolation. The expected game data is present.
- [ ] The compatible rollback exercise passed, and you recorded when switching code would require a restore instead.

You have a verified recovery point and can choose the recovery procedure based on the state of the app and its database.

## Routine Server Maintenance

Start with a recurring calendar reminder. A private alpha can use the tools already installed and an encrypted backup location you control.

| When                             | What to do                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before each update               | Check available disk space, validate the release, take and verify the off-server snapshot, and keep the previous compatible release.                                                                                                                                                                                                    |
| Daily while people play          | Check `systemctl is-active drevan tailscaled`, run the loopback and enrolled-device HTTPS checks, review recent journal errors, and confirm the latest backup timestamp. Pick a backup cadence based on how much game progress testers could accept losing. For active daily play, start with daily snapshots and copy them off-server. |
| Weekly                           | Review CPU, RAM, disk, and burst-test results. Check Tailscale device and tester membership, service and OS updates, and the HTTPS certificate's expiry from an enrolled browser. Check the deploy job history and rotate credentials when access changes.                                                                              |
| Monthly and after backup changes | Restore an off-server copy in isolation, record how long recovery took and what data the snapshot contains, and review backup and release retention. Keep the current and a verified previous release and multiple known-good backups.                                                                                                  |

For a routine game-only snapshot you can use SQLite's `.backup` while the service runs. Reuse the manual backup commands without the service stop, use a new output path, and record the active SHA. Avoid running a routine backup during deployment or migration. If SQLite reports a lock or the backup fails its integrity check, retry when no maintenance is underway. Test that you would notice missed backups, low disk space, a near-expiry certificate, or downtime. Start with an operator-owned check and alert path. Any later end-to-end automated monitor needs its own tailnet access.

**Run on your DigitalOcean Droplet** to review routine OS updates and resource usage.

```sh
sudo apt update
apt list --upgradable
df -h /srv/drevan
free -h
sudo journalctl -u drevan --since today -p warning
```

Use `sudo apt upgrade` during a maintenance window and check `/var/run/reboot-required`. After a reboot, repeat the service and phone checks. Update Node through the project pin and a tested release, since a runtime change can require rebuilding native dependencies. Before inviting testers, perform a small, realistic burst of signups and training with disposable accounts and record response times, failures, and disk or memory pressure.

**Verification checklist**

- [ ] Backup cadence, retention, checks, and an alert path are in use, and the off-server restore drill passed.
- [ ] A rehearsal verified failure diagnosis and release recovery. The app recovers after routine SSH reconnects and service or server restarts.
- [ ] Capacity checks are recorded, and you can enroll and remove testers without giving them administrative or deployment access.

Gate 6 is complete when these checks pass. You can now invite the small external alpha using private HTTPS and operate it with verified recovery procedures.

## Optional: Connecting a Domain Name Later

Start this milestone when a public launch is planned. Keep the private alpha endpoint during evaluation. The new hostname has its own session cookie, so players sign in again while their accounts and characters stay in the same game database.

1. Register the chosen domain with a registrar. In the authoritative DNS panel, create an `A` record for the desired subdomain, such as `play.example.com`, pointing to the Droplet public IPv4. Add an `AAAA` record only if you configured publicly routed IPv6 and tested its firewall and listener. DNS only directs browsers to the server. **Run on your Mac** `dig +short play.example.com A` and, if using IPv6, `dig +short play.example.com AAAA` to confirm the answers match.
2. **On your DigitalOcean Droplet**, install Caddy using the official Debian/Ubuntu package instructions. Secure public registration or decide to allow it before exposing the app. With public web ports still closed, use `sudo nano /etc/caddy/Caddyfile` and enter the real hostname in place of the sample. Confirm proxy trust and secure cookie settings with the Gate 1 implementation. [Caddy installation](https://caddyserver.com/docs/install) · [Caddy reverse proxy](https://caddyserver.com/docs/quick-starts/reverse-proxy)

   ```caddyfile
   play.example.com {
       reverse_proxy 127.0.0.1:3000
   }
   ```

3. **Run on your DigitalOcean Droplet** to validate and apply the configuration.

   ```sh
   sudo caddy validate --config /etc/caddy/Caddyfile
   sudo systemctl enable --now caddy
   sudo systemctl reload caddy
   sudo journalctl -u caddy -n 50 --no-pager
   ```

   **In DigitalOcean**, allow public TCP 80 and 443 to the proxy for challenges, redirects, and HTTPS. Keep 3000 closed and leave SSH restrictions in place. Caddy automatically provisions and renews a certificate for the DNS name when its validation can reach the server. If HTTPS fails, check the DNS answers, firewall, proxy listeners, and Caddy's journal. If Tailscale Serve is still running, verify both endpoints separately. [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)

4. **Run on your Mac** with Tailscale disconnected to test the actual public route.

   ```sh
   curl -I http://play.example.com/
   curl -fsS -o /dev/null -w '%{http_code}\n' https://play.example.com/
   ```

   Expect an HTTP redirect to the HTTPS URL and HTTP 200 over HTTPS. Test the public HTTPS page on desktop and phone, then sign in with your existing account and compare saved progress. Verify the secure cookie and the intended registration policy. Confirm GitHub Actions still deploys through its independent connection. Once the new endpoint is established, retire private Serve access if you no longer need it. A public uptime monitor can now check the public HTTPS address.

**Verification checklist**

- [ ] Public DNS resolves to the intended address and Caddy serves browser-trusted HTTPS. Public HTTP redirects before credentials are submitted.
- [ ] Node stays on loopback. Existing accounts work through public HTTPS and the deploy channel still works.
- [ ] Proxy and certificate monitoring are in place and the alpha URL transition is recorded.

Drevan can now serve the public hostname using the same release and game data.
