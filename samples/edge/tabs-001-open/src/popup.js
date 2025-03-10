document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("checkTabsButton")
    .addEventListener("click", function () {
      const tabList = document.getElementById("tabList");
      tabList.innerHTML = "";

      chrome.tabs.query({}, function (tabs) {
        if (tabs.length === 0) {
          tabList.innerHTML = '<div class="tab-item">No tabs found</div>';
          return;
        }

        const tabsByWindow = {};
        tabs.forEach((tab) => {
          if (!tabsByWindow[tab.windowId]) {
            tabsByWindow[tab.windowId] = [];
          }
          tabsByWindow[tab.windowId].push(tab);
        });

        let windowCount = 1;
        for (const windowId in tabsByWindow) {
          const windowTabs = tabsByWindow[windowId];

          const windowHeader = document.createElement("div");
          windowHeader.textContent = `Window ${windowCount} (${windowTabs.length} tabs)`;
          windowHeader.style.fontWeight = "bold";
          windowHeader.style.marginTop = "8px";
          tabList.appendChild(windowHeader);

          windowTabs.forEach((tab) => {
            const tabItem = document.createElement("div");
            tabItem.className = "tab-item";

            if (tab.active) {
              tabItem.style.backgroundColor = "#f0f0f0";
            }

            if (tab.favIconUrl) {
              const favicon = document.createElement("img");
              favicon.src = tab.favIconUrl;
              favicon.width = 16;
              favicon.height = 16;
              favicon.style.marginRight = "5px";
              favicon.style.verticalAlign = "middle";
              tabItem.appendChild(favicon);
            }

            const title = document.createTextNode(tab.title || tab.url);
            tabItem.appendChild(title);

            tabItem.addEventListener("click", function () {
              chrome.tabs.update(tab.id, { active: true });
              chrome.windows.update(tab.windowId, { focused: true });
            });

            tabList.appendChild(tabItem);
          });

          windowCount++;
        }
      });
    });
});
