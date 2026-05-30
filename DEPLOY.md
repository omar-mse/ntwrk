# Deploying to Oracle Cloud — No Domain Required

This guide walks you through putting your app live on the internet **for free**, with a real
web address and HTTPS. You do **not** need to buy a domain.

**What we're setting up:**

| Piece | What it does |
|---|---|
| **Oracle Cloud VM** | A free computer in the cloud that runs your app 24/7 |
| **DuckDNS** | Gives you a free web address like `yourapp.duckdns.org` |
| **Caddy** | Sits in front of your app, handles HTTPS automatically (no config needed) |
| **PM2** | Keeps your app running even when you're not connected, and restarts it on reboot |

---

## Step 0 — Get your free web address (DuckDNS)

> Do this first — you'll need the address ready when you configure the server.

1. Go to **[https://www.duckdns.org](https://www.duckdns.org)** and sign in with your Google or
   GitHub account.
2. Under **"sub domain"**, type a name you want — e.g. `myapp` → you'll get `myapp.duckdns.org`.
   Click **"add domain"**.
3. You'll see your new subdomain listed. For now, the IP next to it doesn't matter — we'll
   update it in Step 2 once you have the server's IP.
4. At the top of the page, copy your **token** (a long string of letters and numbers). Save it
   somewhere — you'll need it later.

---

## Step 1 — Create the cloud server (Oracle VM)

### 1a — Generate an SSH key (Windows 11)

An SSH key is like a password that lets your laptop log into the server securely — no typing
a password every time. Run this **once** in PowerShell on your laptop:

```powershell
ssh-keygen -t ed25519 -C "oracle-vm"
```

Press **Enter** three times to accept all defaults (no passphrase is fine for personal use).
This creates two files:
- `C:\Users\omarm\.ssh\id_ed25519` — your **private** key (never share this)
- `C:\Users\omarm\.ssh\id_ed25519.pub` — your **public** key (this goes on the server)

To copy your public key so you can paste it:

```powershell
Get-Content C:\Users\omarm\.ssh\id_ed25519.pub | clip
```

### 1b — Create the VM in Oracle Cloud

1. Sign in at **[https://cloud.oracle.com](https://cloud.oracle.com)** (free account, no credit card
   charged for Always Free resources).
2. Go to **Compute → Instances → Create Instance**.
3. Name it anything (e.g. `cards-server`).
4. Under **Image and shape**, click **Change image** → choose **Canonical Ubuntu 22.04**.
5. Under **Shape**, click **Change shape**:
   - First choice: **VM.Standard.A1.Flex** (Ampere ARM, Always Free — 4 OCPU / 24 GB RAM).
   - If you see a "capacity unavailable" error: **VM.Standard.E2.1.Micro** (1 GB RAM — see the
     Gotchas section for an important extra step before building).
6. Under **Add SSH keys** → **Paste public keys** → paste what you copied from `id_ed25519.pub`.
7. Click **Create**.

### 1c — Open the firewall in Oracle Cloud

The VM needs to accept web traffic. By default, only SSH (port 22) is allowed.

1. From the instance page, click the **VCN name** → **Security Lists** → **Default Security List**.
2. Click **Add Ingress Rules** and add two rows:

   | Source | Protocol | Port |
   |---|---|---|
   | 0.0.0.0/0 | TCP | 80 |
   | 0.0.0.0/0 | TCP | 443 |

3. Save. Note the instance's **public IP address** (shown on the instance page).

---

## Step 2 — Point your DuckDNS address at the server

1. Go back to **[https://www.duckdns.org](https://www.duckdns.org)**.
2. Next to your subdomain, paste the **public IP** from Oracle Cloud into the "current ip" field
   and click **"update ip"**.
3. To verify it worked, open PowerShell on your laptop and run:

   ```powershell
   nslookup yourapp.duckdns.org
   ```

   You should see the IP you just pasted. If it doesn't show yet, wait 1 minute and try again.

---

## Step 3 — Connect to the server

Open PowerShell and run:

```powershell
ssh ubuntu@<public-ip>
```

Replace `<public-ip>` with your Oracle instance's IP address.

The first time, you'll see a message like:

```
The authenticity of host '1.2.3.4' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

Type `yes` and press Enter. You're now inside the server — the prompt will change to something
like `ubuntu@instance-name:~$`.

> All commands from here on are run **inside this SSH session** (on the server), not on your laptop,
> unless noted otherwise.

---

## Step 4 — Open the server's OS firewall

Oracle's Ubuntu images have a second firewall (iptables) that blocks everything except SSH.
You need to open ports 80 and 443 here too — the cloud Security List alone isn't enough.

```bash
sudo apt-get install -y iptables-persistent
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80  -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## Step 5 — Install Node.js, pnpm, and PM2

These are the tools your app needs to run.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential
sudo npm install -g pnpm@11 pm2
```

Verify the installs worked:

```bash
node -v    # should print v20.x.x
pnpm -v    # should print 11.x.x
```

---

## Step 6 — Clone and install the app

```bash
# Create a folder for the app and move into it
sudo mkdir -p /opt/cards
sudo chown ubuntu:ubuntu /opt/cards
cd /opt/cards

# Download your code from GitHub
git clone <your-repo-url> .
```

Replace `<your-repo-url>` with your GitHub repo URL (e.g. `https://github.com/your-username/ntwrk.git`).
You can find it on your repo page under **Code → HTTPS**.

```bash
# Install dependencies
# --ignore-scripts is REQUIRED for this project (pnpm 11 security requirement)
pnpm install --ignore-scripts

# Generate the Prisma database client
# (must be done manually because --ignore-scripts skips the automatic postinstall step)
pnpm exec prisma generate
```

---

## Step 7 — Create the environment file

This file holds your secret keys. Create it with:

```bash
nano /opt/cards/.env.local
```

This opens a simple text editor. Paste the following, filling in each value (see below the block
for instructions on each one):

```env
DATABASE_URL="file:/opt/cards/data/dev.db"
AUTH_SECRET="<run: openssl rand -base64 33>"
AUTH_URL="https://yourapp.duckdns.org"
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID="<your google oauth client id>"
AUTH_GOOGLE_SECRET="<your google oauth client secret>"
GEMINI_API_KEY="<your gemini api key>"
NODE_ENV=production
```

**Filling in the values:**

- **`DATABASE_URL`** — leave exactly as shown. This is where your SQLite database file will live.
- **`AUTH_SECRET`** — generate a random value. Open a **second PowerShell window on your laptop** and run:
  ```powershell
  # On Windows 11, PowerShell has OpenSSL via Git Bash, or use:
  [Convert]::ToBase64String((1..33 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
  ```
  Paste the output as the value.
- **`AUTH_URL`** — your DuckDNS address, **with** `https://`. Replace `yourapp` with your actual subdomain.
- **`AUTH_TRUST_HOST`** — leave as `true`. Required when running behind a reverse proxy (Caddy).
- **`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`** — from Google Cloud Console (you already have dev credentials; see Step 10 to add your production URL).
- **`GEMINI_API_KEY`** — from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

To save and exit nano: press **Ctrl+O**, then **Enter**, then **Ctrl+X**.

Now lock down the file so only your user can read it:

```bash
chmod 600 /opt/cards/.env.local
```

---

## Step 8 — Run database migrations and build the app

```bash
# Create the data directory for the SQLite database file
mkdir -p /opt/cards/data

# Apply all database migrations (creates the tables)
pnpm exec prisma migrate deploy

# Build the Next.js app for production
# Note: if you're on the small E2.1.Micro VM (1 GB RAM), see Gotchas first!
pnpm build
```

The build step takes 2–4 minutes. You'll see Next.js compiling pages — this is normal.

---

## Step 9 — Start the app with PM2

PM2 keeps your app running in the background and restarts it automatically if the server reboots.

```bash
# Start the app
pm2 start "pnpm start" --name cards --cwd /opt/cards

# Save the PM2 process list so it survives reboots
pm2 save

# Register PM2 as a system service — this prints a sudo command, run it exactly as printed
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Run the `sudo env PATH=...` command that PM2 prints.

Check that the app started cleanly:

```bash
pm2 logs cards --lines 50
```

You should see Next.js startup logs with no `ERROR` lines. Press **Ctrl+C** to stop tailing logs.

---

## Step 10 — Install Caddy (HTTPS reverse proxy)

Caddy handles HTTPS for you automatically — it fetches a free certificate from Let's Encrypt
on the first request. No configuration needed beyond pointing it at your app.

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

Now configure Caddy. Replace the default config file:

```bash
sudo nano /etc/caddy/Caddyfile
```

Delete everything in the file and paste this (replacing `yourapp` with your actual subdomain):

```
yourapp.duckdns.org {
    reverse_proxy 127.0.0.1:3000
    encode zstd gzip
}
```

Save and exit (Ctrl+O → Enter → Ctrl+X), then reload Caddy:

```bash
sudo systemctl reload caddy
```

Open your browser and go to `https://yourapp.duckdns.org` — you should see your app with a
padlock in the address bar. If you get a certificate error, wait 30 seconds and refresh —
Let's Encrypt needs a moment on the first request.

---

## Step 11 — Update Google OAuth for production

Your app uses Google sign-in. Google needs to know about your new production URL or it will
block logins.

1. Go to **[https://console.cloud.google.com](https://console.cloud.google.com)**.
2. Navigate to **APIs & Services → Credentials** and click on your OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, click **Add URI** and add:
   ```
   https://yourapp.duckdns.org
   ```
4. Under **Authorized redirect URIs**, click **Add URI** and add:
   ```
   https://yourapp.duckdns.org/api/auth/callback/google
   ```
5. Click **Save**.

> You can keep your existing `http://localhost:3000` entries — they coexist fine for local dev.

---

## Step 12 — Set up nightly database backups (optional but recommended)

This creates a daily backup of your SQLite database and keeps 14 days of history.

```bash
crontab -e
```

If asked which editor to use, pick **nano** (usually option 1). Add this line at the bottom:

```
15 3 * * * /usr/bin/sqlite3 /opt/cards/data/dev.db ".backup '/opt/cards/data/dev.$(date +\%F).db'" && find /opt/cards/data -name 'dev.*.db' -mtime +14 -delete
```

Save and exit (Ctrl+O → Enter → Ctrl+X).

---

## Future deploys (updating the app)

Whenever you push new code to GitHub, SSH into the server and run:

```bash
cd /opt/cards
git pull
pnpm install --ignore-scripts
pnpm exec prisma migrate deploy
pnpm build
pm2 reload cards
```

---

## Verification checklist

Run through these after your initial deploy to confirm everything works:

- [ ] Open `https://yourapp.duckdns.org` in your browser — page loads with a padlock (🔒) icon
- [ ] `curl -I https://yourapp.duckdns.org` returns `HTTP/2 200` (no cert warning)
- [ ] Sign up with email + password (tests database write + `AUTH_SECRET`)
- [ ] Sign in with Google (tests OAuth redirect URI + `AUTH_URL` + `AUTH_TRUST_HOST`)
- [ ] Scan a business card (tests `GEMINI_API_KEY` and server internet access)
- [ ] `pm2 logs cards --lines 50` — no ERROR lines
- [ ] `sudo reboot`, wait 30 seconds, visit the site again — PM2 and Caddy restarted automatically

---

## Gotchas

| Problem | Fix |
|---|---|
| Can't reach the app after opening cloud Security List | OCI Ubuntu also has OS-level `iptables` — run Step 4 |
| Google sign-in fails in production | Add production URIs to Google Cloud Console — see Step 11 |
| `pnpm build` crashes / runs out of memory on E2.1.Micro | Add swap before building: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| DuckDNS address not resolving | Re-check the IP is saved in the DuckDNS dashboard; wait 1 min and retry `nslookup` |
| Caddy certificate error / HTTPS not working | Confirm ports 80 and 443 are open in **both** the OCI Security List (Step 1c) **and** iptables (Step 4) |
| Oracle reclaims the Always-Free A1 VM after ~7 days idle | PM2 keeping Node running is usually enough to prevent idle reclamation |

### Keeping your IP stable

Oracle gives each new VM an **ephemeral public IP** that can change if the instance is stopped
and started. To prevent this:

- In the OCI Console, go to **Instance details → Attached VNICs → Primary VNIC** → click the
  IP address → **Reserve** it. A reserved IP stays the same forever.
- If the IP does change, just go back to DuckDNS and update it — your DuckDNS address
  (`yourapp.duckdns.org`) will automatically route to the new IP once you save it there.
