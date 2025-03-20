// background.js
let isRotationActive = false;
let scrollingInProgress = false;
let scrollSpeed = 1; // Default scroll speed in pixels per step

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleRotation") {
    isRotationActive = message.isActive;

    if (isRotationActive) {
      scrollSpeed = message.scrollSpeed || 1;
      startRotation();
    }

    sendResponse({ status: "success", isActive: isRotationActive });
  } else if (message.action === "getStatus") {
    sendResponse({ isActive: isRotationActive });
  }
  return true; // Keep the message channel open for the async response
});

// Function to start the rotation process
async function startRotation() {
  if (!isRotationActive) return;

  try {
    // Get the current active tab
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Scroll the current tab with pauses between viewport heights
    await scrollTabToBottomWithPauses(activeTab.id);

    // Wait 5 seconds after scrolling is complete
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // If rotation is still active, move to the next tab
    if (isRotationActive) {
      await moveToNextTab();

      // Wait 2 seconds after switching tab before starting to scroll
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Continue the rotation process
      startRotation();
    }
  } catch (error) {
    console.error("Error during rotation:", error);
    // If there's an error, wait a bit and try to continue if rotation is still active
    setTimeout(() => {
      if (isRotationActive) startRotation();
    }, 3000);
  }
}

// Function to scroll a tab to the bottom with pauses between viewport heights
async function scrollTabToBottomWithPauses(tabId) {
  scrollingInProgress = true;

  try {
    // Check if we can access the tab
    let dimensions;
    try {
      // Execute script to get page dimensions
      dimensions = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          return {
            totalHeight: Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.offsetHeight,
              document.body.clientHeight,
              document.documentElement.clientHeight
            ),
            viewportHeight: window.innerHeight,
            currentScroll: window.scrollY,
          };
        },
      });
    } catch (scriptError) {
      console.error("Cannot access page content:", scriptError);
      // If we can't access the page, move to the next tab
      scrollingInProgress = false;
      await moveToNextTab();

      // Wait 2 seconds after switching tab
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Continue rotation with the next tab
      if (isRotationActive) {
        startRotation();
      }
      return;
    }

    const { totalHeight, viewportHeight, currentScroll } = dimensions[0].result;

    // Calculate how many viewport moves we need to make
    const viewportsToScroll = Math.ceil(
      (totalHeight - currentScroll) / viewportHeight
    );

    // If already at the bottom, skip scrolling
    if (viewportsToScroll <= 0) {
      scrollingInProgress = false;
      return;
    }

    // Scroll one viewport at a time with pauses
    for (let i = 0; i < viewportsToScroll; i++) {
      // If rotation has been turned off, stop scrolling
      if (!isRotationActive) {
        scrollingInProgress = false;
        return;
      }

      // Scroll smoothly through the current viewport height
      await smoothScrollViewport(tabId, viewportHeight, scrollSpeed);

      // Pause between viewport scrolls (if not the last one)
      if (i < viewportsToScroll - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    scrollingInProgress = false;
  } catch (error) {
    console.error("Error scrolling tab:", error);
    scrollingInProgress = false;
    throw error;
  }
}

// Function to smoothly scroll through one viewport height
async function smoothScrollViewport(tabId, viewportHeight, scrollSpeed) {
  // Calculate step size and frequency based on scrollSpeed
  const scrollStep = 5 * scrollSpeed; // Pixels per step
  const scrollInterval = 50; // Milliseconds between steps
  const stepsNeeded = Math.ceil(viewportHeight / scrollStep);

  return new Promise((resolve) => {
    let currentStep = 0;

    const scrollTimer = setInterval(async () => {
      // If rotation has been turned off, stop scrolling
      if (!isRotationActive) {
        clearInterval(scrollTimer);
        resolve();
        return;
      }

      currentStep++;

      try {
        // Execute script to scroll the page by one step
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (step) => {
            window.scrollBy({
              top: step,
              behavior: "smooth",
            });
          },
          args: [scrollStep],
        });
      } catch (scrollError) {
        console.error("Cannot scroll tab:", scrollError);
        clearInterval(scrollTimer);
        resolve();
        return;
      }

      // If we've completed all steps or reached the bottom, clear the interval
      if (currentStep >= stepsNeeded) {
        clearInterval(scrollTimer);
        resolve();
      }
    }, scrollInterval);
  });
}

// Function to move to the next tab
async function moveToNextTab() {
  try {
    // Get all tabs in the current window
    const tabs = await chrome.tabs.query({ currentWindow: true });

    // Find the current active tab index
    const activeTabIndex = tabs.findIndex((tab) => tab.active);

    // Calculate the next tab index
    const nextTabIndex = (activeTabIndex + 1) % tabs.length;

    // Activate the next tab
    await chrome.tabs.update(tabs[nextTabIndex].id, { active: true });

    // Scroll the new tab back to the top without animation
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabs[nextTabIndex].id },
        func: () => {
          // Scroll to top without smooth animation
          window.scrollTo(0, 0);
        },
      });
    } catch (scrollError) {
      console.error("Could not scroll tab to top:", scrollError);
      // Continue even if we can't scroll to top
    }
  } catch (error) {
    console.error("Error moving to next tab:", error);
    throw error;
  }
}
