document.addEventListener("DOMContentLoaded", function () {
  // Get UI elements
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const intervalSlider = document.getElementById("intervalSlider");
  const intervalInput = document.getElementById("intervalInput");
  const autoStartCheckbox = document.getElementById("autoStartCheckbox");
  const statusElement = document.getElementById("status");

  // Sync slider and input values
  intervalSlider.addEventListener("input", function () {
    intervalInput.value = intervalSlider.value;
  });

  intervalInput.addEventListener("input", function () {
    intervalSlider.value = intervalInput.value;
  });

  // Load saved settings
  chrome.storage.sync.get(
    ["interval", "autoStart", "isActive"],
    function (data) {
      if (data.interval) {
        intervalSlider.value = data.interval;
        intervalInput.value = data.interval;
      }

      if (data.autoStart !== undefined) {
        autoStartCheckbox.checked = data.autoStart;
      }

      updateStatus(data.isActive || false);
    }
  );

  // Start rotation
  startBtn.addEventListener("click", function () {
    const interval = parseInt(intervalInput.value);

    // Save settings
    chrome.storage.sync.set({
      interval: interval,
      autoStart: autoStartCheckbox.checked,
      isActive: true,
    });

    // Start the rotation via background script
    chrome.runtime.sendMessage({
      action: "startRotation",
      interval: interval,
    });

    updateStatus(true);
  });

  // Stop rotation
  stopBtn.addEventListener("click", function () {
    // Save settings
    chrome.storage.sync.set({
      isActive: false,
    });

    // Stop the rotation via background script
    chrome.runtime.sendMessage({
      action: "stopRotation",
    });

    updateStatus(false);
  });

  // Update UI status
  function updateStatus(isActive) {
    if (isActive) {
      statusElement.textContent = "Rotation is active";
      statusElement.className = "status-active";
    } else {
      statusElement.textContent = "Rotation is inactive";
      statusElement.className = "status-inactive";
    }
  }
});
