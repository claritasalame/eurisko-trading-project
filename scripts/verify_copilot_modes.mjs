const token = process.env.MARKETMIND_TEST_TOKEN;
if (!token) throw new Error("MARKETMIND_TEST_TOKEN is required");
const endpoint = "http://127.0.0.1:9228";
const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const page = pages.find((candidate) => candidate.type === "page");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  if (message.error || message.result?.exceptionDetails) handler.reject(new Error(message.error?.message || message.result.exceptionDetails.exception?.description || message.result.exceptionDetails.text));
  else handler.resolve(message.result);
});
const command = (method, params = {}) => {
  const requestId = ++id;
  socket.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
};
const evaluate = async (expression) => (await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const wait = async (expression, timeout = 90000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await sleep(300);
  }
  throw new Error(`Timed out: ${expression}`);
};
const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
const navigate = async (url) => {
  await command("Page.navigate", { url });
  await wait("Boolean(document.body)");
};
await command("Page.enable");
await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

await navigate("http://localhost:3000/");
await evaluate("localStorage.clear()");
await command("Page.reload", { ignoreCache: true });
await wait("getComputedStyle(document.querySelector('[aria-label=\"Open Copilot panel\"]')).position === 'fixed'");
const signedOutLauncher = await evaluate(`(() => { const button=document.querySelector('[aria-label="Open Copilot panel"]'); const rect=button.getBoundingClientRect(); const style=getComputedStyle(button); return {left:rect.left,top:rect.top,rightGap:innerWidth-rect.right,bottomGap:innerHeight-rect.bottom,width:rect.width,height:rect.height,zIndex:style.zIndex,position:style.position,backgroundImage:style.backgroundImage}; })()`);
await click('[aria-label="Open Copilot panel"]');
await wait("document.body.innerText.includes('Sign in to use the portfolio copilot.') && getComputedStyle(document.querySelector('[data-copilot-mode]').parentElement).opacity === '1'");
const signedOutOpen = await evaluate("({mode:document.querySelector('[data-copilot-mode]').dataset.copilotMode, signIn:document.body.innerText.includes('Sign in to use the portfolio copilot.')})");

await evaluate(`localStorage.setItem("eurisko-auth-token", ${JSON.stringify(token)})`);
await command("Page.reload", { ignoreCache: true });
await wait("Boolean(document.querySelector('[aria-label=\"Open Copilot panel\"]'))");
await click('[aria-label="Open Copilot panel"]');
await wait("Boolean(document.querySelector('[aria-label=\"View chat history\"]'))");
await click('[aria-label="View chat history"]');
await wait("document.body.innerText.includes('Previous chats')");
const dockedHistory = await evaluate("({mode:document.querySelector('[data-copilot-mode]').dataset.copilotMode, historyVisible:document.body.innerText.includes('Previous chats'), sessionButtons:document.querySelectorAll('[data-copilot-mode] button').length})");
await evaluate(`([...document.querySelectorAll('[data-copilot-mode] button')].find((button) => button.textContent.trim() === 'Back'))?.click()`);
await wait("Boolean(document.querySelector('[data-copilot-mode] input'))");
await evaluate(`(() => { const input=document.querySelector('[data-copilot-mode] input'); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,'Give me one short AAPL observation'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
await evaluate(`([...document.querySelectorAll('[data-copilot-mode] button')].find((button) => button.textContent.trim() === 'Send'))?.click()`);
await wait("document.body.innerText.includes('Give me one short AAPL observation')");
await wait("!document.body.innerText.includes('Thinking…')", 120000);
const dockedMessage = await evaluate("({userMessage:document.body.innerText.includes('Give me one short AAPL observation'),inputVisible:Boolean(document.querySelector('[data-copilot-mode] input'))})");

const dockedRect = await evaluate("(() => {const r=document.querySelector('[data-copilot-mode]').getBoundingClientRect();return {width:r.width,height:r.height}})()");
await click('[aria-label="Maximize Copilot"]');
await wait("document.querySelector('[data-copilot-mode]').dataset.copilotMode === 'maximized'");
const maximizedRect = await evaluate("(() => {const r=document.querySelector('[data-copilot-mode]').getBoundingClientRect();return {mode:document.querySelector('[data-copilot-mode]').dataset.copilotMode,width:r.width,height:r.height,restore:Boolean(document.querySelector('[aria-label=\"Restore docked Copilot\"]')),inputVisible:Boolean(document.querySelector('[data-copilot-mode] input'))}})()");
await click('[aria-label="View chat history"]');
await wait("document.body.innerText.includes('Previous chats')");
const maximizedHistory = await evaluate("({historyVisible:document.body.innerText.includes('Previous chats'),scrollable:getComputedStyle(document.querySelector('[data-copilot-mode] .overflow-y-auto')).overflowY})");
await evaluate(`([...document.querySelectorAll('[data-copilot-mode] button')].find((button) => button.textContent.trim() === 'Back'))?.click()`);
await wait("Boolean(document.querySelector('[data-copilot-mode] input'))");
await evaluate(`(() => { const input=document.querySelector('[data-copilot-mode] input'); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,'Give me one short MSFT observation'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
await evaluate(`([...document.querySelectorAll('[data-copilot-mode] button')].find((button) => button.textContent.trim() === 'Send'))?.click()`);
await wait("document.body.innerText.includes('Give me one short MSFT observation')");
await wait("!document.body.innerText.includes('Thinking…')", 120000);
const maximizedMessage = await evaluate("({userMessage:document.body.innerText.includes('Give me one short MSFT observation'),inputVisible:Boolean(document.querySelector('[data-copilot-mode] input'))})");
await click('[aria-label="Restore docked Copilot"]');
await wait("document.querySelector('[data-copilot-mode]').dataset.copilotMode === 'docked'");
await sleep(500);
const restoredRect = await evaluate("(() => {const r=document.querySelector('[data-copilot-mode]').getBoundingClientRect();return {mode:document.querySelector('[data-copilot-mode]').dataset.copilotMode,width:r.width,height:r.height}})()");

await navigate("http://localhost:3000/dashboard");
await wait("Boolean(document.querySelector('[data-copilot-mode=\"docked\"]'))");
const dashboard = await evaluate("({launcher:Boolean(document.querySelector('[aria-label=\"Open Copilot panel\"]')),docked:Boolean(document.querySelector('[data-copilot-mode=\"docked\"]')),maximize:Boolean(document.querySelector('[aria-label=\"Maximize Copilot\"]'))})");
console.log(JSON.stringify({signedOutLauncher,signedOutOpen,dockedHistory,dockedMessage,dockedRect,maximizedRect,maximizedHistory,maximizedMessage,restoredRect,dashboard},null,2));
socket.close();
