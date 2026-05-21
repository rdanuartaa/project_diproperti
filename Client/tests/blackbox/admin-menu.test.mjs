import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";
import { spawn } from "node:child_process";
import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import mysql from "mysql2/promise";

const HOST = process.env.E2E_HOST || "localhost";
const PORT = Number(process.env.E2E_PORT || 3000);
const BASE_URL = process.env.E2E_BASE_URL || `http://${HOST}:${PORT}`;
const HEADLESS = process.env.HEADLESS !== "false";
const START_SERVER = process.env.E2E_START_SERVER !== "false";
const REMOTE_URL = process.env.SELENIUM_REMOTE_URL;

const adminRoutes = [
  { path: "/admin/dashboard", label: "Dasboard" },
  { path: "/admin/add-user", label: "Kelola user" },
  { path: "/admin/add-properti", label: "Kelola properti" },
  { path: "/admin/pengajuan-properti", label: "Pengajuan Properti" },
  { path: "/admin/add-artikel", label: "Kelola artikel" },
  { path: "/admin/add-tagartikel", label: "Kelola tag" },
  { path: "/admin/add-faq", label: "Kelola faq" },
];

function requestUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("error", () => resolve(0));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(0);
    });
  });
}

async function waitForServer(url, timeoutMs = 90000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const status = await requestUrl(url);
    if (status >= 200 && status < 500) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Server tidak merespons di ${url}`);
}

async function startServerIfNeeded() {
  const status = await requestUrl(BASE_URL);
  if (status >= 200 && status < 500) return null;
  if (!START_SERVER) throw new Error(`Server belum jalan di ${BASE_URL}.`);

  const child = spawn("npm", ["run", "dev", "--", "-H", HOST, "-p", String(PORT)], {
    cwd: new URL("../../", import.meta.url),
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));

  await waitForServer(BASE_URL);
  return child;
}

async function findChromeBinary() {
  if (REMOTE_URL) return null;
  const candidates = [
    process.env.CHROME_BINARY,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  const { access } = await import("node:fs/promises");
  const { constants } = await import("node:fs");
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {}
  }
  throw new Error("Chrome/Chromium Linux tidak ditemukan untuk Selenium.");
}

async function createDriver() {
  const options = new chrome.Options();
  if (HEADLESS) options.addArguments("--headless=new");
  options.addArguments("--window-size=1440,1000", "--disable-dev-shm-usage", "--no-sandbox");

  const chromeBinary = await findChromeBinary();
  if (chromeBinary) options.setChromeBinaryPath(chromeBinary);

  const builder = new Builder().forBrowser("chrome").setChromeOptions(options);
  if (REMOTE_URL) builder.usingServer(REMOTE_URL);
  return builder.build();
}

function mysqlConfig() {
  return {
    host: process.env.BLACKBOX_DB_HOST || "127.0.0.1",
    port: Number(process.env.BLACKBOX_DB_PORT || 3306),
    database: process.env.BLACKBOX_DB_DATABASE || "properti_db",
    user: process.env.BLACKBOX_DB_USERNAME || "properti_user",
    password: process.env.BLACKBOX_DB_PASSWORD || "properti_pass",
  };
}

function timestamp() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

async function createAdminToken() {
  const connection = await mysql.createConnection(mysqlConfig());
  const now = timestamp();
  const passwordHash = "$2y$10$7EqJtq98hPqEX7fNZaFWoOhi6o8cO18L5e5N2XAyLhMy5qEKd9TVK";

  await connection.execute(
    `INSERT INTO users (name, email, password, role, email_verified_at, created_at, updated_at)
     VALUES (?, ?, ?, 'admin', ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = 'admin', email_verified_at = VALUES(email_verified_at), updated_at = VALUES(updated_at)`,
    ["Admin Propty", "admin@propty.com", passwordHash, now, now, now]
  );

  const [users] = await connection.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [
    "admin@propty.com",
  ]);
  assert.ok(users.length > 0, "User admin test tidak ditemukan");

  const tokenSecret = crypto.randomBytes(40).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(tokenSecret).digest("hex");
  const [result] = await connection.execute(
    `INSERT INTO personal_access_tokens
      (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ["App\\Models\\User", users[0].id, "blackbox-admin", hashedToken, '["*"]', now, now]
  );

  await connection.end();
  return `${result.insertId}|${tokenSecret}`;
}

async function getBodyText(driver) {
  return String(await driver.executeScript("return document.body?.innerText || ''"));
}

async function injectToken(driver, token) {
  await driver.get(BASE_URL);
  await driver.executeScript(
    "localStorage.setItem('auth_token', arguments[0]); window._authTokenCache = arguments[0];",
    token
  );
}

async function visitAdminRoute(driver, route) {
  await driver.get(`${BASE_URL}${route.path}`);
  await driver.wait(
    async () => (await driver.executeScript("return document.readyState")) === "complete",
    30000
  );
  const body = await getBodyText(driver);
  assert.ok(body.trim().length > 0, `${route.path} menampilkan body kosong`);
  assert.ok(!body.includes("404"), `${route.path} terdeteksi 404`);
  assert.ok(!body.includes("Unauthorized"), `${route.path} masih unauthorized`);
  assert.ok(!body.includes("Sign in"), `${route.path} masih diarahkan ke login`);
  assert.ok(
    body.toLowerCase().includes(route.label.toLowerCase()),
    `${route.path} tidak memuat label menu "${route.label}"`
  );
  console.log(`OK admin ${route.path}`);
}

async function run() {
  let server;
  let driver;

  try {
    const token = await createAdminToken();
    driver = await createDriver();
    server = await startServerIfNeeded();
    await injectToken(driver, token);

    for (const route of adminRoutes) {
      await visitAdminRoute(driver, route);
    }

    console.log("Semua menu admin blackbox berhasil diakses dengan token admin test.");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (driver) await driver.quit();
    if (server) server.kill();
  }
}

run();
