console.log("Popup script loaded");

document.getElementById('requestPermissions').addEventListener('click', () => {
  chrome.runtime.sendMessage({action: "requestPermissions"}, (response) => {
    if (response.status === "granted") {
      alert("Permissions granted successfully!");
    } else {
      alert("Permissions were not granted. Some features may not work.");
    }
  });
});

chrome.permissions.contains({
  permissions: ['tabs'],
  origins: ['https://chatgpt.com/*', 'https://claude.ai/*']
}, (result) => {
  if (result) {
    document.getElementById('requestPermissions').style.display = 'none';
  }
});