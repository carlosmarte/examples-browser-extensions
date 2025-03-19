chrome.runtime.onInstalled.addListener(() => {
  // Set default values
  chrome.storage.sync.get(
    ["interval", "autoStart", "isActive"],
    function (data) {
      if (data.interval === undefined) {
        chrome.storage.sync.set({ interval: 30 });
      }

      if (data.autoStart === undefined) {
        chrome.storage.sync.set({ autoStart: false });
      }

      if (data.isActive === undefined) {
        chrome.storage.sync.set({ isActive: false });
      }
    }
  );
});

// On startup, check if auto-start is enabled
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(["autoStart", "interval"], function (data) {
    if (data.autoStart && data.interval) {
      startTabRotation(data.interval);
      chrome.storage.sync.set({ isActive: true });
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startRotation") {
    startTabRotation(message.interval);
    sendResponse({ status: "started" });
  } else if (message.action === "stopRotation") {
    stopTabRotation();
    sendResponse({ status: "stopped" });
  }
  return true;
});

// Alarm listener to switch tabs
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "tabRotationAlarm") {
    rotateToNextTab();
  }
});

// Start tab rotation
function startTabRotation(interval) {
  // Clear any existing alarms
  stopTabRotation();

  // Create a new alarm
  chrome.alarms.create("tabRotationAlarm", {
    delayInMinutes: interval / 60,
    periodInMinutes: interval / 60,
  });
}

// Stop tab rotation
function stopTabRotation() {
  chrome.alarms.clear("tabRotationAlarm");
}

// Switch to the next tab
function rotateToNextTab() {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    if (tabs.length <= 1) return;

    // Find the current active tab
    let activeTabIndex = -1;
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].active) {
        activeTabIndex = i;
        break;
      }
    }

    // Determine the next tab index
    let nextTabIndex = (activeTabIndex + 1) % tabs.length;

    // Activate the next tab
    chrome.tabs.update(tabs[nextTabIndex].id, { active: true });
  });
}
