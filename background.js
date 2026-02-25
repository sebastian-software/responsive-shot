// Copyright (c) 2026 Sebastian Software GmbH
// https://www.sebastian-software.com

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureScreenshot") {
    captureAtWidths(message.tabId, [message.targetWidth], {
      print: message.print,
      printLabel: message.printLabel,
    })
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

async function captureAtWidths(tabId, widths, { print = false, printLabel } = {}) {
  const debuggee = { tabId };

  await chrome.debugger.attach(debuggee, "1.3");

  try {
    // Emulate print media if requested
    if (print) {
      await chrome.debugger.sendCommand(
        debuggee,
        "Emulation.setEmulatedMedia",
        { media: "print" }
      );

      // Strip backgrounds unless the element opts in via print-color-adjust: exact
      // This matches default browser print behavior ("Background graphics" off)
      await chrome.debugger.sendCommand(debuggee, "Runtime.evaluate", {
        expression: `(() => {
          // First, mark elements that opt in to keeping backgrounds
          for (const el of document.querySelectorAll('*')) {
            const pca = getComputedStyle(el).printColorAdjust
              || getComputedStyle(el).webkitPrintColorAdjust;
            if (pca === 'exact') {
              el.dataset.__rsPrintExact = '';
            }
          }

          // Then apply the override, excluding marked elements
          const s = document.createElement('style');
          s.id = '__responsive-shot-print';
          s.textContent = '*:not([data-__rs-print-exact]), *::before, *::after { background: transparent !important; background-image: none !important; box-shadow: none !important; text-shadow: none !important; }';
          document.head.appendChild(s);
        })()`,
      });
    }

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
          mobile: false,
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
      const name = print && printLabel ? `print-${printLabel}` : `screenshot-${width}`;

      await chrome.downloads.download({
        url: dataUrl,
        filename: `${name}-${timestamp}.png`,
        saveAs: false,
      });
    }

    // Reset emulation
    await chrome.debugger.sendCommand(
      debuggee,
      "Emulation.clearDeviceMetricsOverride"
    );
    if (print) {
      await chrome.debugger.sendCommand(debuggee, "Runtime.evaluate", {
        expression: `(() => {
          document.getElementById('__responsive-shot-print')?.remove();
          for (const el of document.querySelectorAll('[data-__rs-print-exact]')) {
            delete el.dataset.__rsPrintExact;
          }
        })()`,
      });
      await chrome.debugger.sendCommand(
        debuggee,
        "Emulation.setEmulatedMedia",
        { media: "" }
      );
    }

    return { success: true };
  } finally {
    await chrome.debugger.detach(debuggee);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
