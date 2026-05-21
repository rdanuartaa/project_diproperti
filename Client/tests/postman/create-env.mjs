import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const outputPath = new URL("./environments/diproperti-local.postman_environment.json", import.meta.url);

function mysqlConfig() {
  return {
    host: process.env.POSTMAN_DB_HOST || "127.0.0.1",
    port: Number(process.env.POSTMAN_DB_PORT || 3306),
    database: process.env.POSTMAN_DB_DATABASE || "properti_db",
    user: process.env.POSTMAN_DB_USERNAME || "properti_user",
    password: process.env.POSTMAN_DB_PASSWORD || "properti_pass",
  };
}

function timestamp() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

async function createTokenFor(email, role = "user") {
  const connection = await mysql.createConnection(mysqlConfig());
  const now = timestamp();
  const passwordHash = "$2y$10$7EqJtq98hPqEX7fNZaFWoOhi6o8cO18L5e5N2XAyLhMy5qEKd9TVK";
  const name = role === "admin" ? "Admin Propty" : "User Postman";

  await connection.execute(
    `INSERT INTO users (name, email, password, role, email_verified_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), email_verified_at = VALUES(email_verified_at), updated_at = VALUES(updated_at)`,
    [name, email, passwordHash, role, now, now, now]
  );

  const [users] = await connection.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (!users.length) throw new Error(`User ${email} tidak ditemukan`);

  const tokenSecret = crypto.randomBytes(40).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(tokenSecret).digest("hex");
  const [result] = await connection.execute(
    `INSERT INTO personal_access_tokens
      (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ["App\\Models\\User", users[0].id, `postman-${role}`, hashedToken, '["*"]', now, now]
  );

  await connection.end();
  return `${result.insertId}|${tokenSecret}`;
}

const adminToken = await createTokenFor("admin@propty.com", "admin");
const userToken = await createTokenFor("postman-user@example.com", "user");

const environment = {
  id: "diproperti-local",
  name: "DIPROPERTI Local",
  values: [
    { key: "base_url", value: process.env.POSTMAN_BASE_URL || "http://localhost:8000/api", enabled: true },
    { key: "admin_token", value: adminToken, enabled: true, type: "secret" },
    { key: "user_token", value: userToken, enabled: true, type: "secret" },
    { key: "property_slug", value: "", enabled: true },
    { key: "article_slug", value: "", enabled: true },
    { key: "tag_slug", value: "", enabled: true },
    { key: "admin_property_id", value: "", enabled: true },
    { key: "admin_article_id", value: "", enabled: true },
    { key: "admin_tag_id", value: "", enabled: true },
    { key: "admin_tag_slug", value: "", enabled: true },
    { key: "admin_faq_id", value: "", enabled: true },
    { key: "submission_property_id", value: "", enabled: true },
    { key: "test_tag_id", value: "", enabled: true },
    { key: "test_faq_id", value: "", enabled: true },
    { key: "test_article_id", value: "", enabled: true },
    { key: "test_property_id", value: "", enabled: true },
  ],
  _postman_variable_scope: "environment",
  _postman_exported_at: new Date().toISOString(),
  _postman_exported_using: "Codex",
};

await mkdir(new URL("./environments/", import.meta.url), { recursive: true });
await writeFile(outputPath, JSON.stringify(environment, null, 2));
console.log(`Postman environment dibuat: ${outputPath.pathname}`);
