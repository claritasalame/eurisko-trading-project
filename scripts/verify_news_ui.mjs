const mode = process.argv[2] ?? "success";
const pages = await fetch("http://127.0.0.1:9226/json/list").then((response) => response.json());
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
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
});
const command = (method, params = {}) => {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
};
const evaluate = async (expression) => {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const waitFor = async (expression, timeout = 30000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${expression}`);
};

await command("Page.enable");
await command("Runtime.enable");

if (mode === "success" || mode === "failure" || mode === "failure-sweep") {
  await command("Page.navigate", { url: `http://localhost:3000/?news-check=${Date.now()}` });
}

if (mode === "failure-sweep") {
  await waitFor("document.body.innerText.includes(\"Couldn't load market indices. Try again.\") && document.body.innerText.includes(\"Couldn't load market news. Try again.\")");
  const landing = await evaluate(`({
    indices: document.body.innerText.includes("Couldn't load market indices. Try again."),
    news: document.body.innerText.includes("Couldn't load market news. Try again."),
    rawFailure: document.body.innerText.includes("Failed to fetch")
  })`);
  await command("Page.navigate", { url: `http://localhost:3000/dashboard?failure-check=${Date.now()}` });
  await waitFor("document.body.innerText.includes(\"Couldn't load quotes right now. Try again.\") && document.body.innerText.includes(\"Couldn't load price data for AAPL. Try again.\")");
  const dashboard = await evaluate(`({
    watchlist: document.body.innerText.includes("Couldn't load quotes right now. Try again."),
    chart: document.body.innerText.includes("Couldn't load price data for AAPL. Try again."),
    rawFailure: document.body.innerText.includes("Failed to fetch")
  })`);
  console.log(JSON.stringify({ landing, dashboard }, null, 2));
} else if (mode === "failure") {
  await waitFor("document.body.innerText.includes(\"Couldn't load market news. Try again.\")");
  console.log(JSON.stringify(await evaluate(`({
    message: [...document.querySelectorAll('section')].find((section) => section.innerText.includes('Latest market news')).innerText,
    hasRetry: [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Retry'),
    hasRawFailure: document.body.innerText.includes('Failed to fetch')
  })`), null, 2));
} else {
  if (mode === "retry") {
    await evaluate("(() => { const section = [...document.querySelectorAll('section')].find((item) => item.innerText.includes('Latest market news')); [...section.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Retry').click(); })()");
  }
  await waitFor("[...document.querySelectorAll('section')].find((section) => section.innerText.includes('Latest market news')).querySelectorAll('a').length >= 3");
  console.log(JSON.stringify(await evaluate(`(() => {
    const section = [...document.querySelectorAll('section')].find((item) => item.innerText.includes('Latest market news'));
    return {
      headlines: [...section.querySelectorAll('a p')].slice(0, 3).map((item) => item.textContent.trim()),
      hasRawFailure: section.innerText.includes('Failed to fetch'),
      hasFriendlyFailure: section.innerText.includes(\"Couldn't load market news. Try again.\")
    };
  })()`), null, 2));
}

socket.close();
