importScripts("/barcode-memo/koder/zbar.js");
importScripts("/barcode-memo/koder/browser.js");

(async () => {
  const koder = await new Koder().initialize({
    wasmDirectory: "/barcode-memo/koder",
  });

  self.addEventListener("message", (event) => {
    const data = event.data;
    const scanResult = koder.decode(data.data, data.width, data.height);
    postMessage({ data: scanResult });
  });
})();
