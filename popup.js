// Copyright (c) 2026 Sebastian Software GmbH
// https://www.sebastian-software.de

const PRESETS = {
  mobile: [360, 390, 428],
  desktop: [1024, 1280, 1536, 1920, 2560],
};

const ALL_WIDTHS = [...PRESETS.mobile, ...PRESETS.desktop];

const currentSizeEl = document.getElementById("current-size");
const screenshotBtn = document.getElementById("screenshot");
const screenshotAllBtn = document.getElementById("screenshot-all");

// Build preset buttons
function buildPresets(widths, containerId) {
  const container = document.getElementById(containerId);
  widths.forEach((width) => {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.dataset.width = width;
    btn.textContent = width;
    btn.addEventListener("click", () => sendMessage({
      action: "captureScreenshot",
      targetWidth: width,
    }));
    container.appendChild(btn);
  });
}

buildPresets(PRESETS.mobile, "presets-mobile");
buildPresets(PRESETS.desktop, "presets-desktop");

function getActiveTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (!tab) return null;
    // tabs permission lets us read tab.url
    if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://"))) {
      return null;
    }
    return tab;
  });
}

function sendMessage(msg) {
  getActiveTab().then((tab) => {
    if (!tab) return;
    chrome.runtime.sendMessage({ ...msg, tabId: tab.id }).catch(() => {});
  });
}

// Init
getActiveTab().then((tab) => {
  if (!tab) {
    currentSizeEl.textContent = "–";
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.innerWidth,
  }).then(([{ result: vw }]) => {
    currentSizeEl.textContent = `${vw}px`;

    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.classList.toggle("active", parseInt(btn.dataset.width) === vw);
    });

    screenshotBtn.addEventListener("click", () => sendMessage({
      action: "captureScreenshot",
      targetWidth: vw,
    }));
  }).catch(() => {
    currentSizeEl.textContent = "–";
  });
});

screenshotAllBtn.addEventListener("click", () => sendMessage({
  action: "captureAll",
  widths: ALL_WIDTHS,
}));
