console.log("Background script started");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  chrome.storage.local.set({ previousPrompts: [] }, () => {
    console.log("Initial storage set");
  });
});

function logTabInfo(tab) {
  console.log("Tab info:", {
    id: tab.id,
    url: tab.url || "undefined",
    status: tab.status,
    active: tab.active,
  });
}

function checkAndLogUrl(url) {
  if (!url) {
    console.log(
      "URL is undefined. This might be a special Chrome page or a page that the extension doesn't have permission to access.",
    );
    return false;
  }

  if (url.includes("chatgpt.com") || url.includes("claude.ai")) {
    console.log("Matching URL found:", url);
    return true;
  }

  console.log("Non-matching URL:", url);
  return false;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("Tab updated event fired", { tabId, changeInfo });
  logTabInfo(tab);

  if (changeInfo.status === "complete") {
    chrome.tabs.get(tabId, (currentTab) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting tab:", chrome.runtime.lastError);
        return;
      }

      logTabInfo(currentTab);
      checkAndLogUrl(currentTab.url);

      if (
        currentTab.url &&
        (currentTab.url.includes("chatgpt.com") ||
          currentTab.url.includes("claude.ai"))
      ) {
        chrome.tabs.sendMessage(
          tabId,
          { action: "checkContentScript" },
          function (response) {
            if (chrome.runtime.lastError) {
              console.log(chrome.runtime.lastError.message);
            } else if (response && response.status === "ok") {
              console.log("Content script is loaded and responsive");
            }
          },
        );
      }
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting activated tab:", chrome.runtime.lastError);
      return;
    }

    logTabInfo(tab);
    checkAndLogUrl(tab.url);
  });
});

function checkPermissions() {
  chrome.permissions.contains(
    {
      permissions: ["tabs"],
      origins: ["https://chatgpt.com/*", "https://claude.ai/*"],
    },
    (result) => {
      if (result) {
        console.log("The extension has the necessary permissions.");
      } else {
        console.log("The extension doesn't have the necessary permissions.");
        console.log(
          "Please click the extension icon to grant the required permissions.",
        );
      }
    },
  );
}

setInterval(checkPermissions, 5 * 60 * 1000);
checkPermissions();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "savePrompt") {
    chrome.storage.local.get("previousPrompts", (result) => {
      let prompts = result.previousPrompts || [];
      prompts.unshift(request.prompt);
      prompts = [...new Set(prompts)].slice(0, 1000);
      chrome.storage.local.set({ previousPrompts: prompts }, () => {
        console.log("Prompt saved:", request.prompt);
        sendResponse({ status: "success" });
      });
    });
    return true;
  } else if (request.action === "requestPermissions") {
    chrome.permissions.request(
      {
        permissions: ["tabs"],
        origins: ["https://chatgpt.com/*", "https://claude.ai/*"],
      },
      (granted) => {
        if (granted) {
          console.log("Permissions granted");
          sendResponse({ status: "granted" });
        } else {
          console.log("Permissions not granted");
          sendResponse({ status: "denied" });
        }
      },
    );
    return true;
  }
});
