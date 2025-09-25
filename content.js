let overlayElements = null;

function createInspector() {
  if (window.__inspectorInitialized) return;
  window.__inspectorInitialized = true;

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'inspector-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '2147483647';
  document.body.appendChild(overlay);

  // Highlight box
  const highlightBox = document.createElement('div');
  highlightBox.className = 'inspector-highlight';
  document.body.appendChild(highlightBox);

  // Panel
  const panel = document.createElement('div');
  panel.className = 'inspector-images-box';

  // Segmented control tabs
  const tabBar = document.createElement('div');
  tabBar.className = 'segmented-control';

  const tabs = [
    { id: 'inspector', label: 'Прицел' },
    { id: 'images', label: 'Пикчи' },
    { id: 'special', label: 'Знаки' },
  ];

  const buttons = {};

  tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.textContent = tab.label;
    if (tab.id === 'inspector') btn.classList.add('active');
    btn.onclick = () => setActiveTab(tab.id);
    tabBar.appendChild(btn);
    buttons[tab.id] = btn;
  });

  panel.appendChild(tabBar);

  // Content containers
  const inspectorContainer = document.createElement('div');
  inspectorContainer.className = 'tab-content';
  inspectorContainer.style.display = 'block';
  inspectorContainer.innerHTML = '<p style="color: #86868B; font-size: 13px; line-height: 1.4;">Наведите курсор на элемент для просмотра информации</p>';

  const imagesContainer = document.createElement('div');
  imagesContainer.className = 'tab-content';
  imagesContainer.style.display = 'none';

  const specialContainer = document.createElement('div');
  specialContainer.className = 'tab-content';
  specialContainer.style.display = 'none';

  panel.appendChild(inspectorContainer);
  panel.appendChild(imagesContainer);
  panel.appendChild(specialContainer);

  overlay.appendChild(panel);

  document.body.style.marginRight = '300px';

  function setActiveTab(tabId) {
    Object.keys(buttons).forEach(id => {
      buttons[id].classList.toggle('active', id === tabId);
    });
    inspectorContainer.style.display = tabId === 'inspector' ? 'block' : 'none';
    imagesContainer.style.display = tabId === 'images' ? 'block' : 'none';
    specialContainer.style.display = tabId === 'special' ? 'block' : 'none';

    if (tabId !== 'inspector') {
      highlightBox.style.opacity = 0;
    }
  }

  // Функция для получения вложенных элементов
  function getNestedElements(element, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];
    
    const children = Array.from(element.children);
    const nestedElements = [];
    
    children.forEach(child => {
      if (child.tagName && !panel.contains(child)) {
        const childInfo = {
          tagName: child.tagName.toLowerCase(),
          className: child.className || '',
          id: child.id || '',
          textContent: child.textContent ? child.textContent.slice(0, 50) + (child.textContent.length > 50 ? '...' : '') : '',
          depth: currentDepth + 1,
          hasChildren: child.children.length > 0
        };
        
        nestedElements.push(childInfo);
        
        // Рекурсивно получаем вложенные элементы
        if (child.children.length > 0 && currentDepth + 1 < maxDepth) {
          nestedElements.push(...getNestedElements(child, maxDepth, currentDepth + 1));
        }
      }
    });
    
    return nestedElements;
  }

  // Функция для создания HTML структуры вложенных элементов
  function createNestedElementsHTML(nestedElements) {
    if (nestedElements.length === 0) {
      return '<p style="color: #86868B; font-size: 12px; font-style: italic;">Нет вложенных элементов</p>';
    }
    
    let html = '<div class="nested-elements">';
    
    nestedElements.forEach(elementInfo => {
      const indent = '  '.repeat(elementInfo.depth - 1);
      const hasChildrenIndicator = elementInfo.hasChildren ? ' <span style="color: #007AFF;">▼</span>' : '';
      
      let displayName = `${elementInfo.tagName}`;
      if (elementInfo.id) {
        displayName += `#${elementInfo.id}`;
      }
      if (elementInfo.className) {
        const classes = elementInfo.className.split(' ').slice(0, 2).join(' ');
        displayName += `.${classes}`;
      }
      
      html += `
        <div class="nested-element" style="margin-left: ${elementInfo.depth * 12}px;">
          <span class="nested-element-tag">${indent}&lt;${displayName}&gt;${hasChildrenIndicator}</span>
          ${elementInfo.textContent ? `<div class="nested-element-text">${elementInfo.textContent}</div>` : ''}
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  // Inspector update on mouse move
  function updateHighlight(e) {
    if (inspectorContainer.style.display === 'none') {
      highlightBox.style.opacity = 0;
      return;
    }

    const target = e.target;

    if (
      target === overlay ||
      target === highlightBox ||
      panel.contains(target)
    ) {
      highlightBox.style.opacity = 0;
      return;
    }

    const rect = target.getBoundingClientRect();
    highlightBox.style.width = rect.width + 'px';
    highlightBox.style.height = rect.height + 'px';
    highlightBox.style.top = rect.top + 'px';
    highlightBox.style.left = rect.left + 'px';
    highlightBox.style.opacity = 1;

    const cs = window.getComputedStyle(target);
    
    // Получаем информацию об элементе
    const elementInfo = {
      tagName: target.tagName.toLowerCase(),
      className: target.className || '',
      id: target.id || '',
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      fontFamily: cs.fontFamily,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      margin: {
        top: cs.marginTop,
        right: cs.marginRight,
        bottom: cs.marginBottom,
        left: cs.marginLeft
      },
      padding: {
        top: cs.paddingTop,
        right: cs.paddingRight,
        bottom: cs.paddingBottom,
        left: cs.paddingLeft
      }
    };

    // Получаем вложенные элементы
    const nestedElements = getNestedElements(target);

    // Проверяем, есть ли изображение в элементе или это сам img
    let imageUrl = '';
    if (target.tagName.toLowerCase() === 'img' && target.src) {
      imageUrl = target.src;
    } else {
      const bgImage = cs.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const urlMatch = bgImage.match(/url\(["']?(.*?)["']?\)/);
        if (urlMatch) {
          imageUrl = urlMatch[1];
        }
      }
    }

    // Формируем название элемента с классами и ID
    let elementName = `&lt;${elementInfo.tagName}`;
    if (elementInfo.id) {
      elementName += ` id="${elementInfo.id}"`;
    }
    if (elementInfo.className) {
      const classes = elementInfo.className.split(' ').slice(0, 3).join(' ');
      elementName += ` class="${classes}"`;
    }
    elementName += '&gt;';

    // Обновляем содержимое инспектора
    let inspectorHTML = `
      <div style="margin-bottom: 24px;">
        <h4 class="section-title">Элемент</h4>
        <div class="code-snippet">${elementName}</div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 class="section-title">Размеры</h4>
        <div class="info-row"><span class="info-label">Ширина:</span> <span class="info-value">${elementInfo.width}px</span></div>
        <div class="info-row"><span class="info-label">Высота:</span> <span class="info-value">${elementInfo.height}px</span></div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 class="section-title">Типографика</h4>
        <div class="info-row"><span class="info-label">Размер шрифта:</span> <span class="info-value">${elementInfo.fontSize}</span></div>
        <div class="info-row"><span class="info-label">Интерлиньяж:</span> <span class="info-value">${elementInfo.lineHeight}</span></div>
        <div class="info-row"><span class="info-label">Шрифт:</span> <span class="info-value">${elementInfo.fontFamily.split(',')[0].replace(/['"]/g, '')}</span></div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 class="section-title">Цвета</h4>
        <div class="color-row">
          <span class="info-label">Цвет текста:</span>
          <div class="color-preview" style="background: ${elementInfo.color};"></div>
          <span class="info-value">${elementInfo.color}</span>
        </div>
        <div class="color-row">
          <span class="info-label">Фон:</span>
          <div class="color-preview" style="background: ${elementInfo.backgroundColor};"></div>
          <span class="info-value">${elementInfo.backgroundColor}</span>
        </div>
      </div>
    `;

    // Добавляем ссылку на изображение, если оно есть
    if (imageUrl) {
      inspectorHTML += `
        <div style="margin-bottom: 24px;">
          <h4 class="section-title">Изображение</h4>
          <a href="${imageUrl}" target="_blank" class="image-link">Открыть изображение</a>
        </div>
      `;
    }

    // Добавляем информацию о вложенных элементах
    inspectorHTML += `
      <div style="margin-bottom: 24px;">
        <h4 class="section-title">Вложенные элементы (${nestedElements.length})</h4>
        ${createNestedElementsHTML(nestedElements)}
      </div>
    `;

    // Добавляем информацию о margin, если есть
    if (elementInfo.margin.top !== '0px' || elementInfo.margin.right !== '0px' || elementInfo.margin.bottom !== '0px' || elementInfo.margin.left !== '0px') {
      inspectorHTML += `
        <div style="margin-bottom: 24px;">
          <h4 class="section-title">Margin</h4>
          <div class="spacing-grid">
            <span class="spacing-item">T: ${elementInfo.margin.top}</span>
            <span class="spacing-item">R: ${elementInfo.margin.right}</span>
            <span class="spacing-item">B: ${elementInfo.margin.bottom}</span>
            <span class="spacing-item">L: ${elementInfo.margin.left}</span>
          </div>
        </div>
      `;
    }

    // Добавляем информацию о padding, если есть
    if (elementInfo.padding.top !== '0px' || elementInfo.padding.right !== '0px' || elementInfo.padding.bottom !== '0px' || elementInfo.padding.left !== '0px') {
      inspectorHTML += `
        <div style="margin-bottom: 24px;">
          <h4 class="section-title">Padding</h4>
          <div class="spacing-grid">
            <span class="spacing-item">T: ${elementInfo.padding.top}</span>
            <span class="spacing-item">R: ${elementInfo.padding.right}</span>
            <span class="spacing-item">B: ${elementInfo.padding.bottom}</span>
            <span class="spacing-item">L: ${elementInfo.padding.left}</span>
          </div>
        </div>
      `;
    }

    inspectorContainer.innerHTML = inspectorHTML;
  }

  document.addEventListener('mousemove', updateHighlight);

  // Images tab
  function gatherImages() {
    const imgs = [];
    document.querySelectorAll('img[src]').forEach(img => {
      imgs.push(img.src);
    });
    return [...new Set(imgs)];
  }

  function renderImages() {
    imagesContainer.innerHTML = '';
    const imgs = gatherImages();
    if (imgs.length === 0) {
      imagesContainer.innerHTML = '<p style="color: #86868B; font-size: 13px;">На странице нет изображений.</p>';
      return;
    }
    imgs.forEach(src => {
      const wrapper = document.createElement('div');
      wrapper.className = 'media-item';

      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.onerror = () => { img.style.display = 'none'; };

      const linkBlock = document.createElement('div');
      linkBlock.style.display = 'flex';
      linkBlock.style.flexDirection = 'column';
      linkBlock.style.justifyContent = 'center';

      const link = document.createElement('a');
      link.href = src;
      link.target = '_blank';
      link.textContent = src.length > 35 ? src.slice(0, 30) + '...' : src;
      link.style.marginBottom = '4px';

      const sizeSpan = document.createElement('span');
      sizeSpan.style.fontSize = '11px';
      sizeSpan.style.color = '#86868B';

      const naturalImg = new Image();
      naturalImg.onload = function () {
        sizeSpan.textContent = `${naturalImg.naturalWidth}px × ${naturalImg.naturalHeight}px`;
      };
      naturalImg.onerror = function () {
        sizeSpan.textContent = '';
      };
      naturalImg.src = src;

      linkBlock.appendChild(link);
      linkBlock.appendChild(sizeSpan);

      wrapper.appendChild(img);
      wrapper.appendChild(linkBlock);
      imagesContainer.appendChild(wrapper);
    });
  }

  renderImages();

  // Special chars tab
  const specialChars = [
    { char: '₽', name: 'Рубль' },
    { char: 'м²', name: 'Кв. метр' },
    { char: 'м³', name: 'Куб. метр' },
    { char: '«', name: 'Лев. кав.' },
    { char: '»', name: 'Прав. кав.' },
    { char: '–', name: 'Кор. тире' },
    { char: '—', name: 'Дл. тире' },
    { char: '©', name: 'Копирайт' },
    { char: '®', name: 'Рег. знак' }
  ];

  const specialGrid = document.createElement('div');
  specialGrid.className = 'special-chars-grid';

  specialChars.forEach(({ char, name }) => {
    const btn = document.createElement('button');
    btn.className = 'special-char-btn';

    const sym = document.createElement('span');
    sym.className = 'special-char-symbol';
    sym.textContent = char;

    const nm = document.createElement('span');
    nm.className = 'special-char-name';
    nm.textContent = name;

    btn.appendChild(sym);
    btn.appendChild(nm);

    btn.title = `Копировать символ «${char}»`;

    btn.onclick = () => {
      navigator.clipboard.writeText(char).then(() => {
        const old = sym.textContent;
        sym.textContent = '✓';
        setTimeout(() => sym.textContent = old, 1500);
      }).catch(() => {
        alert(`Не удалось скопировать символ «${char}»`);
      });
    };

    specialGrid.appendChild(btn);
  });

  specialContainer.appendChild(specialGrid);

  overlayElements = { overlay, highlightBox, panel };
}

function removeInspector() {
  if (!window.__inspectorInitialized) return;
  if (overlayElements) {
    Object.values(overlayElements).forEach(el => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  }
  window.__inspectorInitialized = false;
  document.body.style.marginRight = '';
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggle_inspector') {
    if (window.__inspectorInitialized) {
      removeInspector();
      sendResponse({ active: false });
    } else {
      createInspector();
      sendResponse({ active: true });
    }
  } else if (message.action === 'get_status') {
    sendResponse({ active: !!window.__inspectorInitialized });
  }
  return true;
});
