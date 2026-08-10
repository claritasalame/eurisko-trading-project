import fs from "node:fs/promises";
const endpoint = "http://127.0.0.1:9226";
const pages = await fetch(`${endpoint}/json/list`).then((r) => r.json());
const page = pages.find((p) => p.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, bad) => {
  ws.addEventListener("open", ok, { once: true });
  ws.addEventListener("error", bad, { once: true });
});
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data),
    h = pending.get(m.id);
  if (!h) return;
  pending.delete(m.id);
  m.error ? h.reject(new Error(m.error.message)) : h.resolve(m.result);
});
const cmd = (method, params = {}) => {
  const requestId = ++id;
  ws.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) =>
    pending.set(requestId, { resolve, reject }),
  );
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const evalJs = async (expression) => {
  const r = await cmd("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
};
const wait = async (expression, timeout = 60000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evalJs(expression)) return;
    await sleep(250);
  }
  throw new Error(`Timed out: ${expression}`);
};
const shot = async (name) => {
  const r = await cmd("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  await fs.writeFile(`artifacts/${name}.png`, Buffer.from(r.data, "base64"));
};
await cmd("Page.enable");
await cmd("Runtime.enable");
await cmd("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await evalJs("localStorage.clear()");
await cmd("Page.navigate", { url: "http://localhost:3000/" });
await wait(
  "document.body.innerText.includes('MarketMIND') && document.body.innerText.includes('Sign in to see your real portfolio summary')",
);
await wait(
  "document.querySelectorAll('#preview article').length === 4 && document.body.innerText.includes('Latest market news')",
);
const signedOut = await evalJs(
  `({brand:document.body.innerText.includes('MarketMIND'),logo:[...document.querySelectorAll('header div')].some(n=>n.textContent.trim()==='M'),navSignIn:document.querySelector('header').innerText.includes('Sign in'),portfolioCta:document.body.innerText.includes('Sign in to see your real portfolio summary'),hasFakeBalance:document.body.innerText.includes('$128,420'),indices:document.querySelectorAll('#preview article').length===4})`,
);
const anchors = {};
for (const name of ["Features", "How it works", "Preview", "Trust"]) {
  await evalJs(
    `[...document.querySelectorAll('header a')].find(a=>a.textContent.trim()===${JSON.stringify(name)}).click()`,
  );
  await sleep(900);
  anchors[name] = await evalJs(
    `({hash:location.hash,targetExists:Boolean(document.querySelector(location.hash)),scrollY:window.scrollY})`,
  );
}
await shot("landing-signed-out");
await evalJs(
  "[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Start exploring')).click()",
);
await wait("location.pathname === '/register'");
const signedOutCta = await evalJs("location.pathname");
await cmd("Page.navigate", { url: "http://localhost:3000/login" });
await wait("Boolean(document.querySelector('#email'))");
await sleep(1000);
await evalJs(
  `(()=>{const set=(s,v)=>{const e=document.querySelector(s);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));};set('#email','test@example.com');set('#password','testpass123');document.querySelector('form').requestSubmit();})()`,
);
await wait("location.pathname === '/dashboard'");
await cmd("Page.navigate", { url: "http://localhost:3000/" });
await wait(
  "Boolean(document.querySelector('header [aria-label=\"Open account menu\"]'))",
);
await wait(
  "document.body.innerText.includes('AAPL') && document.body.innerText.includes('moderate') && document.body.innerText.includes('PORTFOLIO VALUE')",
);
const signedIn = await evalJs(
  `({accountIcon:Boolean(document.querySelector('header [aria-label="Open account menu"]')),navHasRawEmail:document.querySelector('header').innerText.includes('test@example.com'),portfolioValue:document.body.innerText.includes('$1626.66'),holding:document.body.innerText.includes('2 shares'),risk:document.body.innerText.toLowerCase().includes('moderate')})`,
);
await evalJs(
  "document.querySelector('header [aria-label=\"Open account menu\"]').click()",
);
await wait(
  "document.querySelector('header').innerText.includes('Profile') && document.querySelector('header').innerText.includes('Sign out')",
);
const dropdown = await evalJs(
  "({profile:document.querySelector('header').innerText.includes('Profile'),signOut:document.querySelector('header').innerText.includes('Sign out')})",
);
await shot("landing-signed-in");
await evalJs(
  "[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Start exploring')).click()",
);
await wait("location.pathname === '/dashboard'");
const signedInCta = await evalJs("location.pathname");
console.log(
  JSON.stringify(
    { signedOut, anchors, signedOutCta, signedIn, dropdown, signedInCta },
    null,
    2,
  ),
);
ws.close();
