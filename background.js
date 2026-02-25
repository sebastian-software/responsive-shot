// Copyright (c) 2026 Sebastian Software GmbH
// https://www.sebastian-software.de

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureScreenshot") {
    captureAtWidths(message.tabId, [message.targetWidth])
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "captureAll") {
    captureAtWidths(message.tabId, message.widths)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

async function captureAtWidths(tabId, widths) {
  const debuggee = { tabId };

  await chrome.debugger.attach(debuggee, "1.3");

  try {
    for (const width of widths) {
      // Emulate target width with a normal viewport height
      // Using a standard height keeps vh-based layouts (like min-height: 100vh) intact
      await chrome.debugger.sendCommand(
        debuggee,
        "Emulation.setDeviceMetricsOverride",
        {
          width,
          height: width < 768 ? 800 : 900,
          deviceScaleFactor: 1,
          mobile: width < 768,
        }
      );

      // Let the page reflow
      await sleep(300);

      // Measure true content height by finding the bottom-most element
      // This avoids min-height: 100vh/100dvh inflating the height
      const { result: heightResult } = await chrome.debugger.sendCommand(
        debuggee,
        "Runtime.evaluate",
        {
          expression: `(() => {
            const all = document.body.querySelectorAll('*');
            let maxBottom = 0;
            for (const el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.height > 0 && rect.bottom > maxBottom) {
                maxBottom = rect.bottom;
              }
            }
            return Math.ceil(maxBottom + window.scrollY);
          })()`,
          returnByValue: true,
        }
      );
      const pageHeight = heightResult.value;

      // Capture full page
      const screenshot = await chrome.debugger.sendCommand(
        debuggee,
        "Page.captureScreenshot",
        {
          format: "png",
          clip: { x: 0, y: 0, width, height: pageHeight, scale: 1 },
          captureBeyondViewport: true,
        }
      );

      const dataUrl = "data:image/png;base64," + screenshot.data;
      const timestamp = Date.now();

      await chrome.downloads.download({
        url: dataUrl,
        filename: `screenshot-${width}-${timestamp}.png`,
        saveAs: false,
      });
    }

    // Reset
    await chrome.debugger.sendCommand(
      debuggee,
      "Emulation.clearDeviceMetricsOverride"
    );

    return { success: true };
  } finally {
    await chrome.debugger.detach(debuggee);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
