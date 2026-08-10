import fs from "node:fs/promises";

const pages = await fetch("http://127.0.0.1:9223/json/list").then((response) => response.json());
const page = pages.find((item) => item.type === "page");
if (!page) throw new Error("No Chrome page target found");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let nextId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); const handler = pending.get(message.id); if (!handler) return; pending.delete(message.id); message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result); });
function command(method, params = {}) { const id = ++nextId; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => pending.set(id, { resolve, reject })); }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evaluate = async (expression) => { const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; };
const navigate = async (url) => { await command("Page.navigate", { url }); await sleep(1200); };
const waitFor = async (expression, timeout = 20000) => { const start = Date.now(); while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await sleep(250); } throw new Error(`Timed out: ${expression}`); };
const screenshot = async (name) => { const result = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); await fs.writeFile(`artifacts/${name}.png`, Buffer.from(result.data, "base64")); };

await command("Page.enable");
await command("Runtime.enable");
await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await navigate("http://localhost:3000/login");
await waitFor("Boolean(document.querySelector('#password'))");
await evaluate(`(() => { const element = document.querySelector('#password'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, 'claritaadmin'); element.dispatchEvent(new Event('input', { bubbles: true })); })()`);
const initialPasswordType = await evaluate("document.querySelector('#password').type");
await evaluate("document.querySelector('[aria-label=\"Show password\"]').click()");
const visiblePasswordType = await evaluate("document.querySelector('#password').type");
const visibleAriaLabel = await evaluate("document.querySelector('#password').parentElement.querySelector('button').getAttribute('aria-label')");
await screenshot("admin-password-visible");
await evaluate("document.querySelector('[aria-label=\"Hide password\"]').click()");
const hiddenPasswordType = await evaluate("document.querySelector('#password').type");

await evaluate(`(() => { const set = (selector, value) => { const element = document.querySelector(selector); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); }; set('#email', 'claritasalame@outlook.com'); set('#password', 'claritaadmin'); document.querySelector('form').requestSubmit(); })()`);
await waitFor("location.pathname === '/dashboard'");
await waitFor("Boolean(document.querySelector('[aria-label=\"Open account menu\"]'))");
await evaluate("document.querySelector('[aria-label=\"Open account menu\"]').click()");
await waitFor("[...document.querySelectorAll('a')].some((a) => a.textContent.trim() === 'Admin')");
const dropdownHasAdmin = await evaluate("[...document.querySelectorAll('a')].some((a) => a.textContent.trim() === 'Admin')");
await screenshot("admin-account-menu");
await evaluate("[...document.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Admin').click()");
await waitFor("location.pathname === '/admin'");
await waitFor("document.body.innerText.includes('claritasalame@outlook.com') && document.body.innerText.includes('test@example.com')");
const userTable = await evaluate(`({ path: location.pathname, hasAdmin: document.body.innerText.includes('claritasalame@outlook.com'), hasRegularUser: document.body.innerText.includes('test@example.com'), hasAdminBadge: document.body.innerText.includes('Admin') })`);
await screenshot("admin-users");
await evaluate("[...document.querySelectorAll('tr')].find((row) => row.innerText.includes('test@example.com')).click()");
await waitFor("document.body.innerText.includes('Sessions · test@example.com')");
await waitFor("document.querySelectorAll('section button').length > 0");
await evaluate("document.querySelector('section button').click()");
await waitFor("document.body.innerText.includes('Message history') && document.body.innerText.includes('technology stocks')");
const history = await evaluate(`({ hasHistory: document.body.innerText.includes('Message history'), hasUserMessage: document.body.innerText.includes('technology stocks'), hasAssistantMessage: document.body.innerText.includes('AI companies') })`);
await screenshot("admin-chat-history");

console.log(JSON.stringify({ passwordToggle: { initialPasswordType, visiblePasswordType, visibleAriaLabel, hiddenPasswordType }, dropdownHasAdmin, userTable, history }, null, 2));
socket.close();
