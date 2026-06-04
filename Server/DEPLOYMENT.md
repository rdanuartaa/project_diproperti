# Automatic Server Deployment

Backend akan otomatis divalidasi dan di-redeploy ketika perubahan pada folder
`Server/` di-push ke branch `main`. Workflow juga dapat dijalankan manual melalui
tab **Actions** di GitHub.

## Persiapan Server Produksi

Server produksi harus memiliki Git, Docker, Docker Compose, dan akses SSH.
Konfigurasikan SSH key server agar memiliki akses read ke repository GitHub,
lalu clone repository satu kali:

```bash
git clone git@github.com:rdanuartaa/project_diproperti.git /opt/project_diproperti
cd /opt/project_diproperti/Server
cp .env.example .env
docker compose up -d --build
```

Isi `.env` produksi dan pastikan `APP_KEY` sudah dibuat sebelum mengaktifkan
auto-deploy:

```bash
docker compose exec app php artisan key:generate
```

User SSH untuk deployment harus dapat menjalankan Docker tanpa prompt `sudo`
dan memiliki izin baca/tulis pada folder repository.

## GitHub Secrets

Tambahkan secrets berikut pada repository GitHub melalui
**Settings > Secrets and variables > Actions**:

| Secret | Contoh | Keterangan |
| --- | --- | --- |
| `SERVER_HOST` | `api.example.com` | Host atau alamat IP server produksi |
| `SERVER_USER` | `deploy` | User SSH deployment |
| `SERVER_PORT` | `22` | Port SSH, opsional jika menggunakan port 22 |
| `SERVER_DEPLOY_PATH` | `/opt/project_diproperti` | Path root repository di server |
| `SERVER_SSH_PRIVATE_KEY` | isi private key | Private key milik user deployment |
| `SERVER_KNOWN_HOSTS` | output `ssh-keyscan` | Fingerprint host SSH |
| `SERVER_HEALTHCHECK_URL` | `https://api.example.com` | URL health check opsional |

Buat nilai `SERVER_KNOWN_HOSTS` dari komputer tepercaya:

```bash
ssh-keyscan -p 22 api.example.com
```

Workflow berada di `.github/workflows/deploy-server.yml`. Proses deployment
produksi dijalankan oleh `Server/scripts/deploy.sh`, yang membangun image,
menjalankan container, menerapkan migrasi, membuat cache Laravel, dan melakukan
HTTP health check.

Jika `SERVER_HEALTHCHECK_URL` tidak diisi, workflow memakai
`http://127.0.0.1:8000/`.
