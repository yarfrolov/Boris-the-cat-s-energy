function updateButton(isActive) {
    const btn = document.getElementById('toggle-btn');
    if (isActive) {
      btn.textContent = '';
    } else {
      btn.textContent = '';
    }
  }
  
  function toggleInspector() {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggle_inspector'}, response => {
        if (chrome.runtime.lastError) {
          // Скрипт не загружен, включаем его
          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['content.js']
          });
          updateButton(true);
        } else if (response) {
          updateButton(!response.active);
        }
      });
    });
  }
  
  document.getElementById('toggle-btn').addEventListener('click', toggleInspector);
  
  // При открытии popup запрашиваем состояние
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {action: 'get_status'}, response => {
      updateButton(response && response.active);
    });
  });
  