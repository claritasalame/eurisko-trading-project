import fs from "node:fs/promises";

const endpoint = "http://127.0.0.1:9222";
const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const page = pages.find((item) => item.type === "page");
if (!page) throw new Error("No Chrome page target found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
});

function command(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const navigate = async (url) => {
  await command("Page.navigate", { url });
  await sleep(1500);
};
const waitFor = async (expression, timeout = 15000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
};
const screenshot = async (name) => {
  const result = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  await fs.writeFile(`artifacts/${name}.png`, Buffer.from(result.data, "base64"));
};

await command("Page.enable");
await command("Runtime.enable");
await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

const email = `ui-test-${Date.now()}@example.com`;
await navigate("http://localhost:3000/register");
await waitFor("Boolean(document.querySelector('#register-email'))");
await evaluate(`(() => {
  const set = (selector, value) => {
    const element = document.querySelector(selector);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  };
  set('#register-email', ${JSON.stringify(email)});
  set('#register-password', 'testpass123');
  document.querySelector('form').requestSubmit();
})()`);
await waitFor("location.pathname === '/dashboard'", 20000);
await waitFor("Boolean(document.querySelector('[aria-label=\"Open account menu\"]'))");
const dashboard = await evaluate(`({
  path: location.pathname,
  hasAccountIcon: Boolean(document.querySelector('[aria-label="Open account menu"]')),
  hasSignIn: document.body.innerText.includes('Sign in')
})`);
await screenshot("auth-dashboard");

await evaluate("document.querySelector('[aria-label=\"Open account menu\"]').click()");
await waitFor("document.body.innerText.includes('Profile') && document.body.innerText.includes('Sign out')");
const menu = await evaluate(`({
  hasProfile: document.body.innerText.includes('Profile'),
  hasSignOut: document.body.innerText.includes('Sign out')
})`);
await screenshot("auth-account-menu");

await evaluate("[...document.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Profile').click()");
await waitFor("location.pathname === '/dashboard/profile'");
await waitFor(`document.body.innerText.includes(${JSON.stringify(`Signed in as ${email}`)})`);
const profile = await evaluate(`({ path: location.pathname, text: document.body.innerText })`);
await screenshot("auth-profile");

await navigate("http://localhost:3000/dashboard");
await waitFor("Boolean(document.querySelector('[aria-label=\"Open account menu\"]'))");
await evaluate("document.querySelector('[aria-label=\"Open account menu\"]').click()");
await waitFor("document.body.innerText.includes('Sign out')");
await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Sign out').click()");
await waitFor("location.pathname === '/'");
const signedOut = await evaluate(`({ path: location.pathname, hasSignIn: document.body.innerText.includes('Sign in') })`);

await navigate("http://localhost:3000/dashboard/profile");
await waitFor("document.body.innerText.includes('Sign in to view your profile')");
const protectedProfile = await evaluate(`({ path: location.pathname, text: document.body.innerText })`);
await screenshot("auth-signed-out-profile");

console.log(JSON.stringify({ email, dashboard, menu, profile: { path: profile.path, scopedToEmail: profile.text.includes(email) }, signedOut, protectedProfile: { path: protectedProfile.path, showsPrompt: protectedProfile.text.includes('Sign in to view your profile') } }, null, 2));
socket.close();
