function updateButton(isActive) {
  const btn = document.getElementById('toggle-btn');
  const body = document.body;

  if (isActive) {
    btn.textContent = 'Выключить';
    btn.style.background = 'rgba(255, 255, 255, 0.8)';
    btn.style.color = '#000000';
    body.classList.add('active');
  } else {
    btn.textContent = 'Активировать';
    btn.style.background = 'rgba(255, 255, 255, 0.1)';
    btn.style.color = '#ffffff';
    body.classList.remove('active');
  }
}

function toggleInspector() {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    if (!tabs[0]) return;

    // Сначала проверяем статус
    chrome.tabs.sendMessage(tabs[0].id, {action: 'get_status'}, response => {
      if (chrome.runtime.lastError) {
        console.log('Скрипт не загружен, включаем его');
        chrome.scripting.insertCSS({
          target: {tabId: tabs[0].id},
          files: ['styles.css']
        }).finally(() => {
          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['content.js']
          });
        }).then(() => {
          // Даем время на инициализацию content script
          setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'toggle_inspector'}, response => {
              if (response) {
                updateButton(response.active);
              }
            });
          }, 200);
        }).catch(error => {
          console.error('Ошибка загрузки скрипта:', error);
        });
      } else {
        // Скрипт загружен, переключаем состояние
        chrome.tabs.sendMessage(tabs[0].id, {action: 'toggle_inspector'}, response => {
          if (response) {
            updateButton(response.active);
          }
        });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleInspector);
  }

  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, {action: 'get_status'}, response => {
      if (chrome.runtime.lastError) {
        console.log('Content script не загружен');
        updateButton(false);
      } else {
        updateButton(response && response.active);
      }
    });
  });

});
