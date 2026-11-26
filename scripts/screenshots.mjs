// Screenshots of the Expo web build in phone viewports (Lab 8 report).
// Usage: PLAYWRIGHT_PATH=../CampusMeet-Web/node_modules/playwright node scripts/screenshots.mjs <outDir> [baseUrl] [apiUrl]
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");
const [out = "screenshots", base = "http://localhost:8081", api = "http://127.0.0.1:8000/api/v1"] = process.argv.slice(2);

async function login(alias) {
  const res = await fetch(`${api}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `${alias}@example.invalid`, password: "campusmeet2026" }),
  });
  return res.json();
}

async function activeTicketId(auth) {
  const res = await fetch(`${api}/me/tickets`, { headers: { Authorization: `Bearer ${auth.access_token}` } });
  return (await res.json()).items.find((t) => t.status === "registered")?.id;
}

const SHOTS = [
  { name: "catalogue", path: "/" },
  { name: "event", path: "/event/ev-ux-workshop-2026", auth: "artem" },
  { name: "tickets", path: "/tickets", auth: "artem" },
  { name: "pass", path: "pass", auth: "artem" },
  { name: "schedule", path: "/schedule", auth: "artem" },
  { name: "profile-login", path: "/profile" },
  { name: "scanner", path: "/profile/scanner", auth: "daria" },
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
for (const device of ["iPhone 15 Pro", "Pixel 7"]) {
  for (const scheme of ["light", "dark"]) {
    for (const shot of SHOTS) {
      if (scheme === "dark" && !["catalogue", "pass", "event"].includes(shot.name)) continue;
      const context = await browser.newContext({ ...devices[device], colorScheme: scheme, locale: "ru-RU" });
      let path = shot.path;
      if (shot.auth) {
        const auth = await login(shot.auth);
        await context.addInitScript((a) => {
          localStorage.setItem("cm.access", a.access_token);
          localStorage.setItem("cm.refresh", a.refresh_token);
          localStorage.setItem("cm.user", JSON.stringify(a.user));
        }, auth);
        if (path === "pass") path = `/tickets/${await activeTicketId(auth)}`;
      }
      const page = await context.newPage();
      if (shot.name === "pass") await page.goto(base + "/tickets", { waitUntil: "networkidle" }); // warm the offline cache
      await page.goto(base + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const slug = device.replaceAll(" ", "-").toLowerCase();
      await page.screenshot({ path: `${out}/mobile-${slug}-${scheme}-${shot.name}.png` });
      await context.close();
    }
  }
}
await browser.close();
console.log("saved to", out);
