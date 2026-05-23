# 🏠 DIPROPERTI

Platform properti modern berbasis Laravel dan Next.js yang menyediakan fitur pencarian properti, komparasi properti, rekomendasi properti, simulasi KPR, dashboard admin, serta sistem pengajuan properti oleh pengguna.

---

![Laravel](https://img.shields.io/badge/Laravel-13-red?style=for-the-badge\&logo=laravel)
![PHP](https://img.shields.io/badge/PHP-8.3-blue?style=for-the-badge\&logo=php)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge\&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge\&logo=nextdotjs)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?style=for-the-badge\&logo=docker)
![MySQL](https://img.shields.io/badge/MySQL-8-orange?style=for-the-badge\&logo=mysql)
![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-green?style=for-the-badge\&logo=nginx)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-black?style=for-the-badge\&logo=githubactions)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-black?style=for-the-badge\&logo=vercel)
![SCSS](https://img.shields.io/badge/SCSS-Styling-pink?style=for-the-badge\&logo=sass)
![Postman](https://img.shields.io/badge/Postman-API_Testing-orange?style=for-the-badge\&logo=postman)

---

# ✨ Main Features

* 🔍 Pencarian Properti
* 🏡 Detail Properti
* 📊 Komparasi Properti
* 🤖 Rekomendasi Properti
* 🧮 Simulasi KPR
* 👨‍💼 Dashboard Admin
* 🧾 Pengajuan Properti User
* 📈 Statistik Platform
* 🔐 Authentication & Authorization
* 📱 Responsive Design
* ⚡ CI/CD Deployment
* 🐳 Dockerized Environment

---

# 🛠️ Technology Used

Daftar teknologi utama yang digunakan dalam proses pengembangan, deployment, dan integrasi layanan pada aplikasi.

| FRONTEND      | BACKEND               | DEPLOYMENT     | THIRD PARTY        |
| ------------- | --------------------- | -------------- | ------------------ |
| Next.js 15    | Laravel 13            | GitHub Actions | Cloudflare Storage |
| React 19      | PHP 8.3               | Docker         | Google OAuth       |
| SCSS          | MySQL 8               | Nginx          | Postman            |
| Axios         | REST API              | VPS Ubuntu     | GitHub             |
| Responsive UI | Authentication System | Vercel         | Google Maps API    |

---

# 📂 Project Structure

```bash
project_diproperti/
│
├── Client/               # Frontend Next.js
├── Server/               # Backend Laravel
├── docker/               # Docker Configuration
├── docker-compose.yml
├── .gitattributes
├── .gitignore
└── README.md
```

---

# 🚀 Installation Guide

## 1. Clone Repository

```bash
git clone https://github.com/rdanuartaa/project_diproperti.git
```

Masuk ke folder project:

```bash
cd project_diproperti
```

---

# 🐳 Run Using Docker

## Build & Run Container

```bash
docker compose up -d --build
```

Cek container berjalan:

```bash
docker ps
```

---

# ⚙️ Backend Setup (Laravel)

Masuk ke container Laravel:

```bash
docker exec -it properti-app bash
```

Install dependency:

```bash
composer install
```

Copy environment:

```bash
cp .env.example .env
```

Generate key:

```bash
php artisan key:generate
```

Migrasi database:

```bash
php artisan migrate
```

Optimize Laravel:

```bash
php artisan optimize
```

---

# 💻 Frontend Setup (Next.js)

Masuk ke folder client:

```bash
cd Client
```

Install dependency:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

---

# 🌐 Access Application

## Frontend

```bash
http://localhost:3000
```

## Backend Laravel

```bash
http://localhost:8000
```

## phpMyAdmin

```bash
http://localhost:8081
```

---

# 🔑 Environment Example

```env
APP_NAME=DIPROPERTI
APP_ENV=production
APP_DEBUG=false

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=properti_db
DB_USERNAME=root
DB_PASSWORD=your_password
```

---

# 🐳 Docker Services

| Service      | Description             |
| ------------ | ----------------------- |
| properti-app | Laravel PHP Application |
| properti-web | Nginx Web Server        |
| properti-db  | MySQL Database          |
| properti-pma | phpMyAdmin              |

---

# 🔄 CI/CD Deployment

Project ini menggunakan:

* GitHub Actions
* Docker
* VPS Ubuntu
* Nginx Reverse Proxy
* Vercel Deployment

untuk mendukung proses deployment otomatis dan scalable architecture.

---

# 📸 Preview

Tambahkan screenshot aplikasi di sini.

```md
![Preview](preview-image.png)
```

---

# 👨‍💻 Developer

Developed by:

### Rizal Danuarta Akbar

GitHub:
https://github.com/rdanuartaa

---

# 📄 License

This project is developed for educational and portfolio purposes.
