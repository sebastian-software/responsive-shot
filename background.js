// Copyright (c) 2026 Sebastian Software GmbH
// https://www.sebastian-software.de

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureScreenshot") {
    captureFullPage(message.tabId, message.width, message.height)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message }));

    return true; // keep message channel open for async response
  }
});

async function captureFullPage(tabId, viewportWidth, viewportHeight) {
  const debuggee = { tabId };

  await chrome.debugger.attach(debuggee, "1.3");

  try {
    // Get full page dimensions
    const { result } = await chrome.debugger.sendCommand(
      debuggee,
      "Runtime.evaluate",
      {
        expression: `JSON.stringify({
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight
        })`,
        returnByValue: false,
      }
    );
    const { width: pageWidth, height: pageHeight } = JSON.parse(result.value);

    // Override metrics to full page height so the entire page renders
    await chrome.debugger.sendCommand(
      debuggee,
      "Emulation.setDeviceMetricsOverride",
      {
        width: viewportWidth,
        height: pageHeight,
        deviceScaleFactor: 1,
        mobile: false,
      }
    );

    // Capture the full page
    const screenshot = await chrome.debugger.sendCommand(
      debuggee,
      "Page.captureScreenshot",
      {
        format: "png",
        clip: { x: 0, y: 0, width: viewportWidth, height: pageHeight, scale: 1 },
        captureBeyondViewport: true,
      }
    );

    // Reset metrics
    await chrome.debugger.sendCommand(
      debuggee,
      "Emulation.clearDeviceMetricsOverride"
    );

    const dataUrl = "data:image/png;base64," + screenshot.data;
    const timestamp = Date.now();
    const filename = `screenshot-${viewportWidth}x${pageHeight}-${timestamp}.png`;

    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
    });

    return { success: true, downloadId };
  } finally {
    await chrome.debugger.detach(debuggee);
  }
}
