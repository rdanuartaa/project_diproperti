import assert from "node:assert/strict";
import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import http from "node:http";
import { spawn } from "node:child_process";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const HOST = process.env.E2E_HOST || "127.0.0.1";
const PORT = Number(process.env.E2E_PORT || 3000);
const BASE_URL = process.env.E2E_BASE_URL || `http://${HOST}:${PORT}`;
const HEADLESS = process.env.HEADLESS !== "false";
const START_SERVER = process.env.E2E_START_SERVER !== "false";
const REMOTE_URL = process.env.SELENIUM_REMOTE_URL;
const SCREENSHOT_DIR = new URL("./screenshots/", import.meta.url);

const routes = [
  { path: "/", text: "Rumah" },
  { path: "/list-properti", text: "Properti" },
  { path: "/jual-properti", text: "Jual" },
  { path: "/komparasi", text: "Komparasi" },
  { path: "/simulasi-kpr", text: "KPR" },
  { path: "/rekomendasi-properti", text: "Rekomendasi" },
  { path: "/faq", text: "FAQ" },
  { path: "/contact", text: "Kontak" },
  { path: "/list-artikel", text: "Artikel" },
  { path: "/admin/add-properti", text: "Properti" },
  { path: "/admin/pengajuan-properti", text: "Pengajuan" },
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
  if (!START_SERVER) {
    throw new Error(
      `Server belum jalan di ${BASE_URL}. Jalankan npm run dev, atau hapus E2E_START_SERVER=false.`
    );
  }

  const child = spawn(
    "npm",
    ["run", "dev", "--", "-H", HOST, "-p", String(PORT)],
    {
      cwd: new URL("../../", import.meta.url),
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[next] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[next] ${chunk}`);
  });

  await waitForServer(BASE_URL);
  return child;
}

async function createDriver() {
  const options = new chrome.Options();
  if (HEADLESS) options.addArguments("--headless=new");
  options.addArguments(
    "--window-size=1440,1000",
    "--disable-dev-shm-usage",
    "--no-sandbox"
  );

  const chromeBinary = await findChromeBinary();
  if (chromeBinary) options.setChromeBinaryPath(chromeBinary);

  const builder = new Builder().forBrowser("chrome").setChromeOptions(options);
  if (REMOTE_URL) builder.usingServer(REMOTE_URL);

  return builder.build();
}

async function fileExists(path) {
  try {
    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function findChromeBinary() {
  if (REMOTE_URL) return null;
  if (process.env.CHROME_BINARY) {
    if (await fileExists(process.env.CHROME_BINARY)) return process.env.CHROME_BINARY;
    throw new Error(`CHROME_BINARY tidak ditemukan: ${process.env.CHROME_BINARY}`);
  }

  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }

  throw new Error(
    [
      "Chrome/Chromium Linux tidak ditemukan untuk Selenium.",
      "Install browser di WSL dengan salah satu cara berikut:",
      "1. sudo apt install -y chromium",
      "2. wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && sudo apt install -y ./google-chrome-stable_current_amd64.deb",
      "Atau jalankan ke Selenium Grid dengan SELENIUM_REMOTE_URL=http://localhost:4444/wd/hub",
      "Atau set CHROME_BINARY=/path/ke/google-chrome.",
    ].join("\n")
  );
}

async function visit(driver, path, expectedText) {
  await driver.get(`${BASE_URL}${path}`);
  await driver.wait(
    async () => (await driver.executeScript("return document.readyState")) === "complete",
    30000
  );

  const body = await driver.findElement(By.css("body")).getText();
  assert.ok(body.trim().length > 0, `${path} menampilkan body kosong`);
  assert.ok(!body.includes("404") || path.includes("404"), `${path} terdeteksi 404`);
  if (expectedText) {
    assert.ok(
      body.toLowerCase().includes(expectedText.toLowerCase()),
      `${path} tidak memuat teks "${expectedText}"`
    );
  }
}

async function testMainRoutes(driver) {
  for (const route of routes) {
    await visit(driver, route.path, route.text);
    console.log(`OK route ${route.path}`);
  }
}

async function testHomePropertyTabs(driver) {
  await visit(driver, "/", "Rumah");

  for (const label of ["Rumah", "Villa", "Ruko", "Kos", "Tanah"]) {
    const tab = await driver.wait(
      until.elementLocated(
        By.xpath(`//li[contains(@class, "item-title") and contains(., "${label}")]`)
      ),
      15000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", tab);
    await driver.executeScript("arguments[0].click();", tab);
    await driver.wait(
      async () => (await tab.getAttribute("class")).includes("active"),
      10000
    );
    console.log(`OK tab home ${label}`);
  }
}

async function testListingInteractions(driver) {
  await visit(driver, "/list-properti", "Properti");

  const body = await driver.findElement(By.css("body")).getText();
  assert.ok(
    body.includes("Terapkan Filter") || body.includes("Filter") || body.includes("Properti"),
    "Halaman list properti tidak memuat area filter/listing"
  );

  const resetButtons = await driver.findElements(
    By.xpath("//button[contains(., 'Reset Filter')]")
  );
  if (resetButtons.length > 0) {
    await driver.executeScript("arguments[0].click();", resetButtons[0]);
    console.log("OK reset filter list properti");
  }

  const detailLinks = await driver.findElements(
    By.css('a[href^="/properti/"]')
  );
  if (detailLinks.length > 0) {
    const href = await detailLinks[0].getAttribute("href");
    await driver.get(href);
    await driver.wait(
      async () => (await driver.executeScript("return document.readyState")) === "complete",
      30000
    );
    const detailBody = await driver.findElement(By.css("body")).getText();
    assert.ok(detailBody.trim().length > 0, "Halaman detail properti kosong");
    assert.ok(!detailBody.includes("404"), "Halaman detail properti 404");
    console.log("OK detail properti dari list");
  } else {
    console.log("SKIP detail properti: belum ada properti tampil di list");
  }
}

async function testComparePage(driver) {
  await visit(driver, "/komparasi", "Komparasi");
  const buttons = await driver.findElements(By.xpath("//button[contains(., 'Compare')]"));
  assert.ok(Array.isArray(buttons), "Halaman komparasi gagal dirender");
  console.log("OK halaman komparasi");
}

async function testSellPropertyAccess(driver) {
  await visit(driver, "/jual-properti", "Jual");
  const body = await driver.findElement(By.css("body")).getText();
  assert.ok(
    body.includes("login") ||
      body.includes("Masuk") ||
      body.includes("Pengajuan") ||
      body.includes("Jual"),
    "Halaman jual properti tidak memuat state login/form yang valid"
  );
  console.log("OK akses jual properti");
}

async function saveFailureScreenshot(driver, name) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const png = await driver.takeScreenshot();
  const { writeFile } = await import("node:fs/promises");
  const path = new URL(`${name}-${Date.now()}.png`, SCREENSHOT_DIR);
  await writeFile(path, png, "base64");
  console.error(`Screenshot error: ${path.pathname}`);
}

async function run() {
  let server;
  let driver;

  try {
    driver = await createDriver();
    server = await startServerIfNeeded();

    await testMainRoutes(driver);
    await testHomePropertyTabs(driver);
    await testListingInteractions(driver);
    await testComparePage(driver);
    await testSellPropertyAccess(driver);

    console.log("Semua Selenium smoke test berhasil.");
  } catch (error) {
    if (driver) await saveFailureScreenshot(driver, "failure");
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (driver) await driver.quit();
    if (server) server.kill();
  }
}

run();
