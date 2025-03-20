// popup.js
// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Popup DOM loaded");

  // Get references to UI elements with null checks
  const rotationOnBtn = document.getElementById("rotation-on");
  const rotationOffBtn = document.getElementById("rotation-off");
  const statusDisplay = document.getElementById("status");
  const scrollSpeedSlider = document.getElementById("scroll-speed");
  const speedValueDisplay = document.getElementById("speed-value");

  console.log("Elements found:", {
    rotationOnBtn: !!rotationOnBtn,
    rotationOffBtn: !!rotationOffBtn,
    statusDisplay: !!statusDisplay,
    scrollSpeedSlider: !!scrollSpeedSlider,
    speedValueDisplay: !!speedValueDisplay,
  });

  // Function to update UI based on rotation status
  function updateUI(isActive) {
    if (statusDisplay) {
      if (isActive) {
        if (rotationOnBtn) rotationOnBtn.classList.add("active");
        if (rotationOffBtn) rotationOffBtn.classList.remove("active");
        statusDisplay.textContent = "Rotation is currently ON";
        statusDisplay.className = "status active";
      } else {
        if (rotationOnBtn) rotationOnBtn.classList.remove("active");
        if (rotationOffBtn) rotationOffBtn.classList.add("active");
        statusDisplay.textContent = "Rotation is currently OFF";
        statusDisplay.className = "status inactive";
      }
    }
  }

  // Get initial status from background script
  chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
    if (response) {
      updateUI(response.isActive);
    }
  });

  // Update speed value display when slider changes
  if (scrollSpeedSlider && speedValueDisplay) {
    scrollSpeedSlider.addEventListener("input", () => {
      speedValueDisplay.textContent = scrollSpeedSlider.value;
    });
  }

  // Handle rotation ON button
  if (rotationOnBtn) {
    rotationOnBtn.addEventListener("click", () => {
      const speed = scrollSpeedSlider ? parseInt(scrollSpeedSlider.value) : 1;
      chrome.runtime.sendMessage(
        {
          action: "toggleRotation",
          isActive: true,
          scrollSpeed: speed,
        },
        (response) => {
          if (response) {
            updateUI(response.isActive);
          }
        }
      );
    });
  }

  // Handle rotation OFF button
  if (rotationOffBtn) {
    rotationOffBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage(
        {
          action: "toggleRotation",
          isActive: false,
        },
        (response) => {
          if (response) {
            updateUI(response.isActive);
          }
        }
      );
    });
  }
});
