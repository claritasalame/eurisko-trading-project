import fs from "node:fs/promises";

const endpoint = "http://127.0.0.1:9225";
const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const page = pages.find((item) => item.type === "page");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); const handler = pending.get(message.id); if (!handler) return; pending.delete(message.id); message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result); });
const command = (method, params = {}) => { const requestId = ++id; socket.send(JSON.stringify({ id: requestId, method, params })); return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject })); };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evaluate = async (expression) => { const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; };
const waitFor = async (expression, timeout = 30000) => { const start = Date.now(); while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await sleep(250); } throw new Error(`Timed out: ${expression}`); };
const screenshot = async (name) => { const result = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); await fs.writeFile(`artifacts/${name}.png`, Buffer.from(result.data, "base64")); };

await command("Page.enable");
await command("Runtime.enable");
await command("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1100, deviceScaleFactor: 1, mobile: false });
await command("Page.navigate", { url: "http://localhost:3000/dashboard" });
await waitFor("document.querySelectorAll('path.recharts-line-curve').length >= 1", 60000);
await sleep(1000);

const ranges = {};
for (const range of ["1D", "1W", "1M", "1Y"]) {
  await evaluate(`[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === ${JSON.stringify(range)}).click()`);
  await waitFor("document.querySelectorAll('path.recharts-line-curve').length >= 1", 60000);
  await sleep(1000);
  ranges[range] = await evaluate(`({ path: document.querySelector('path.recharts-line-curve').getAttribute('d'), ticks: [...document.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-value')].map((node) => node.textContent), activeClass: [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === ${JSON.stringify(range)}).className })`);
}
await screenshot("market-range-1y");

const baseLineCount = await evaluate("document.querySelectorAll('path.recharts-line-curve').length");
await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'SMA').click()");
await waitFor(`document.querySelectorAll('path.recharts-line-curve').length > ${baseLineCount}`);
const smaOnLineCount = await evaluate("document.querySelectorAll('path.recharts-line-curve').length");
await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'SMA').click()");
await waitFor(`document.querySelectorAll('path.recharts-line-curve').length === ${baseLineCount}`);
const smaOffLineCount = await evaluate("document.querySelectorAll('path.recharts-line-curve').length");

await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'RSI').click()");
await waitFor("Boolean(document.querySelector('[aria-label=\"RSI indicator chart\"] path.recharts-line-curve'))");
const rsiVisible = await evaluate("Boolean(document.querySelector('[aria-label=\"RSI indicator chart\"] path.recharts-line-curve'))");
await sleep(1000);
await screenshot("market-rsi");
await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'RSI').click()");
await waitFor("!document.querySelector('[aria-label=\"RSI indicator chart\"]')");
const rsiHidden = await evaluate("!document.querySelector('[aria-label=\"RSI indicator chart\"]')");

await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'MACD').click()");
await waitFor("document.querySelectorAll('[aria-label=\"MACD indicator chart\"] path.recharts-line-curve').length === 2");
const macdVisible = await evaluate("document.querySelectorAll('[aria-label=\"MACD indicator chart\"] path.recharts-line-curve').length === 2");
await sleep(1000);
await screenshot("market-macd");
await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'MACD').click()");
await waitFor("!document.querySelector('[aria-label=\"MACD indicator chart\"]')");
const macdHidden = await evaluate("!document.querySelector('[aria-label=\"MACD indicator chart\"]')");

await waitFor("[...document.querySelectorAll('h2')].some((node) => node.textContent.includes('NEWS FEED'))");
const news = await evaluate(`(() => { const section = [...document.querySelectorAll('section')].find((node) => node.innerText.includes('NEWS FEED')); return [...section.querySelectorAll('a[href]')].slice(0, 3).map((link) => ({ headline: link.querySelector('p')?.textContent, sourceAndTime: link.querySelector('div')?.innerText, url: link.href, target: link.target })); })()`);
await screenshot("market-news-fixed");
const linkPoint = await evaluate(`(() => { const section = [...document.querySelectorAll('section')].find((node) => node.innerText.includes('NEWS FEED')); const rect = section.querySelector('a[href]').getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()`);
await command("Input.dispatchMouseEvent", { type: "mousePressed", x: linkPoint.x, y: linkPoint.y, button: "left", clickCount: 1 });
await command("Input.dispatchMouseEvent", { type: "mouseReleased", x: linkPoint.x, y: linkPoint.y, button: "left", clickCount: 1 });
await sleep(1500);
const openPages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const openedArticleUrl = openPages.find((item) => item.type === "page" && item.url !== "http://localhost:3000/dashboard")?.url ?? null;

console.log(JSON.stringify({ ranges: Object.fromEntries(Object.entries(ranges).map(([key, value]) => [key, { ticks: value.ticks, pathSignature: value.path.slice(0, 80), active: value.activeClass.includes('accent-signal') }])), distinctRangePaths: new Set(Object.values(ranges).map((value) => value.path)).size, indicators: { baseLineCount, smaOnLineCount, smaOffLineCount, rsiVisible, rsiHidden, macdVisible, macdHidden }, news, openedArticleUrl }, null, 2));
socket.close();
