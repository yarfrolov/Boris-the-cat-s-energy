// Обработка смены иконки
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setIcon' && sender.tab) {
    const iconPath = message.active
      ? {
          '16': 'icon16_active.png',
          '48': 'icon48_active.png',
          '128': 'icon128_active.png',
        }
      : {
          '16': 'icon16.png',
          '48': 'icon48.png',
          '128': 'icon128.png',
        };

    chrome.action.setIcon({
      path: iconPath,
      tabId: sender.tab.id,
    });
  }
});

chrome.action.onClicked.addListener(tab => {
  // Проверяем, внедрен ли уже скрипт, отправив сообщение
  chrome.tabs.sendMessage(tab.id, { action: 'get_status' }, response => {
    // Если получаем ошибку, значит скрипт не внедрен
    if (chrome.runtime.lastError) {
      console.log('Скрипт не загружен, внедряем...');
      // Внедряем CSS и JS
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['styles.css'],
      })
      .then(() => {
        return chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        });
      })
      .then(() => {
        // Теперь, когда скрипт внедрен, отправляем сообщение
        chrome.tabs.sendMessage(tab.id, { action: 'toggle_inspector' });
      })
      .catch(err => console.error('Ошибка внедрения скрипта:', err));
    } else {
      // Если скрипт уже есть, просто отправляем сообщение для переключения
      console.log('Скрипт уже загружен, переключаем.');
      chrome.tabs.sendMessage(tab.id, { action: 'toggle_inspector' });
    }
  });
});

// Clear inspector selection when user switches between browser tabs
// Removed tabs.onActivated listener to avoid requiring the 'tabs' permission