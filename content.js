let overlayElements = null;
let pinnedElement = null;
let pinToolbar = null;

function createInspector() {
    if (window.__inspectorInitialized) return;
    window.__inspectorInitialized = true;

    console.log('Создаем инспектор');

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

    const panelHeader = document.createElement('div');
    panelHeader.className = 'panel-header';
    panel.appendChild(panelHeader);

    // Collapsed state icon (visible only when collapsed via CSS)
    const collapsedIcon = document.createElement('img');
    collapsedIcon.className = 'collapsed-icon';
    try {
        collapsedIcon.src = chrome.runtime.getURL('icon128.png');
    } catch (e) {
        collapsedIcon.src = 'icon128.png';
    }
    panel.appendChild(collapsedIcon);

    const panelTop = document.createElement('div');
    panelTop.className = 'panel-top';
    panelHeader.appendChild(panelTop);

    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    panelTop.appendChild(dragHandle);

    const collapseBtn = document.createElement('div');
    collapseBtn.className = 'panel-collapse-btn';
    panelTop.appendChild(collapseBtn);

    collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Determine if we're collapsing (vs expanding)
        const willCollapse = !panel.classList.contains('collapsed');
        panel.classList.toggle('collapsed');
        if (willCollapse) {
            // If inspector tab is active while collapsing, switch it off
            if (buttons && buttons['inspector'] && buttons['inspector'].classList.contains('active')) {
                setActiveTab('images');
            }
            // Hide highlight and clear pin state
            if (typeof highlightBox !== 'undefined' && highlightBox) {
                highlightBox.style.opacity = 0;
            }
            pinnedElement = null;
            if (pinToolbar) {
                pinToolbar.remove();
                pinToolbar = null;
            }
        }
    });

    panel.addEventListener('click', (e) => {
        if (panel.classList.contains('collapsed')) {
            // We check if the click was directly on the panel (widget)
            // and not on the collapse button inside it, which has its own listener.
            if (e.target === panel) {
                panel.classList.remove('collapsed');
            }
        }
    });

    const panelTitle = document.createElement('div');
    panelTitle.className = 'panel-title';
    panelTitle.textContent = "Boris the cat's energy";
    panelTop.appendChild(panelTitle);

    const menuButton = document.createElement('button');
    menuButton.className = 'panel-menu-btn';
    menuButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path id="Vector 8" d="M14 6C14 7.10457 13.1046 8 12 8C10.8954 8 10 7.10457 10 6C10 4.89543 10.8954 4 12 4C13.1046 4 14 4.89543 14 6Z" fill="#fff" fill-rule="nonzero"/><path id="Vector 9" d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z" fill="#fff" fill-rule="nonzero"/><path id="Vector 10" d="M14 18C14 19.1046 13.1046 20 12 20C10.8954 20 10 19.1046 10 18C10 16.8954 10.8954 16 12 16C13.1046 16 14 16.8954 14 18Z" fill="#fff" fill-rule="nonzero"/></svg>';
    panelTop.appendChild(menuButton);

    const dropdown = document.createElement('div');
    dropdown.className = 'panel-dropdown';
    dropdown.innerHTML = `<a href="https://yarfrolov.github.io/Boris-the-cat-s-energy/redpol.html" target="_blank">🔗 Глоссарий</a>`;
    panelHeader.appendChild(dropdown);

    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        if (dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
        }
    });

    let isDragging = false;
    let offsetX, offsetY;
    
    dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        panel.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        panel.style.right = 'auto';
        panel.style.left = `${Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, x))}px`;
        panel.style.top = `${Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, y))}px`;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        panel.style.transition = 'opacity 0.3s ease';
    });

    const tabBar = document.createElement('div');
    tabBar.className = 'segmented-control';

    const tabs = [
        { id: 'inspector', label: 'Прицел' },
        { id: 'images', label: 'Пикчи' },
        { id: 'special', label: 'Знаки' },
        { id: 'info', label: 'Инфо' },
    ];

    const buttons = {};
    tabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.textContent = tab.label;
        if (tab.id === 'images') btn.classList.add('active');
        btn.onclick = () => setActiveTab(tab.id);
        tabBar.appendChild(btn);
        buttons[tab.id] = btn;
    });
    panelHeader.appendChild(tabBar);

    const inspectorContainer = document.createElement('div');
    inspectorContainer.className = 'tab-content';
    inspectorContainer.style.display = 'none';
    inspectorContainer.innerHTML = '<div class="section-title">Выберите элемент</div><div style="color: #86868B;">Наведите курсор на элемент для просмотра информации</div>';

    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'tab-content';
    imagesContainer.style.display = 'block';

    const specialContainer = document.createElement('div');
    specialContainer.className = 'tab-content';
    specialContainer.style.display = 'none';

    const infoContainer = document.createElement('div');
    infoContainer.className = 'tab-content';
    infoContainer.style.display = 'none';

    panel.appendChild(inspectorContainer);
    panel.appendChild(imagesContainer);
    panel.appendChild(specialContainer);
    panel.appendChild(infoContainer);

    overlay.appendChild(panel);


    function setActiveTab(tabId) {
        Object.keys(buttons).forEach(id => {
            buttons[id].classList.toggle('active', id === tabId);
        });

        inspectorContainer.style.display = tabId === 'inspector' ? 'block' : 'none';
        imagesContainer.style.display = tabId === 'images' ? 'block' : 'none';
        specialContainer.style.display = tabId === 'special' ? 'block' : 'none';
        infoContainer.style.display = tabId === 'info' ? 'block' : 'none';

        if (tabId !== 'inspector') {
            // Clear any current selection when leaving the inspector tab
            if (typeof highlightBox !== 'undefined' && highlightBox) {
                highlightBox.style.opacity = 0;
            }
            pinnedElement = null;
            if (pinToolbar) {
                pinToolbar.remove();
                pinToolbar = null;
            }
            inspectorContainer.innerHTML = '<div class="section-title">Выберите элемент</div><div style="color: #86868B;">Наведите курсор на элемент для просмотра информации</div>';
        } else {
            if(pinnedElement) {
                const rect = pinnedElement.getBoundingClientRect();
                highlightBox.style.left = rect.left + 'px';
                highlightBox.style.top = rect.top + 'px';
                highlightBox.style.width = rect.width + 'px';
                highlightBox.style.height = rect.height + 'px';
                highlightBox.style.opacity = 1;
            }
        }
    }

    // Handle ESC to clear selection in inspector tab
    const escHandler = (e) => {
        if (e.key !== 'Escape') return;
        if (inspectorContainer.style.display === 'none') return;
        pinnedElement = null;
        if (highlightBox) {
            highlightBox.style.opacity = 0;
        }
        if (pinToolbar) {
            pinToolbar.remove();
            pinToolbar = null;
        }
        inspectorContainer.innerHTML = '<div class="section-title">Выберите элемент</div><div style="color: #86868B;">Наведите курсор на элемент для просмотра информации</div>';
    };
    document.addEventListener('keydown', escHandler);
    window.__inspectorEscHandler = escHandler;

    function renderInfo() {
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const dpr = window.devicePixelRatio;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const pageTitle = document.title;
        const getOgTag = (property) => {
            const tag = document.querySelector(`meta[property="og:${property}"]`);
            return tag ? tag.content : 'Не указано';
        };

        const og = {
            title: getOgTag('title'),
            description: getOgTag('description'),
            image: getOgTag('image'),
            url: getOgTag('url'),
        };

        let previewHtml = '';
        const displayTitle = og.title !== 'Не указано' ? og.title : pageTitle;

        if (og.image !== 'Не указано' || (displayTitle && displayTitle.trim() !== '')) {
            const pageUrl = og.url !== 'Не указано' ? og.url : window.location.href;
            let displayUrl = pageUrl;
            try {
                displayUrl = new URL(pageUrl).hostname;
            } catch (e) {}

            previewHtml = `
            <div class="section-title">Превью страницы</div>
            <div class="og-preview">
                <div class="og-block">
                    ${og.image !== 'Не указано' ? `<img src="${og.image}" class="og-image" alt="OG Image">` : ''}
                    ${og.image !== 'Не указано' ? `<a href="${og.image}" target="_blank" class="download-og-link">Скачать OG</a>` : ''}
                </div>
                <div class="og-title">${displayTitle}</div>
                <div class="og-url"><a href="${pageUrl}" target="_blank" title="${pageUrl}">${displayUrl}</a></div>
                <div class="og-description">${og.description !== 'Не указано' ? og.description : ''}</div>
            </div>
        `;
        }

        infoContainer.innerHTML = `
            ${previewHtml}
            <div class="section-title">Информация о экране</div>
            <div class="info-row">
                <span class="info-label">Разрешение экрана:</span>
                <span class="info-value">${screenWidth}px × ${screenHeight}px</span>
            </div>
            <div class="info-row">
                <span class="info-label">Размер вьюпорта:</span>
                <span class="info-value">${viewportWidth}px × ${viewportHeight}px</span>
            </div>
            <div class="info-row">
                <span class="info-label">Device Pixel Ratio:</span>
                <span class="info-value">${dpr}</span>
            </div>
        `;
    }

    renderInfo();

    window.addEventListener('resize', () => {
        if (window.__inspectorInitialized) {
            renderInfo();
        }
    });

    function updateInspector(element) {
        // First, render the standard properties for the element.
        renderElementProperties(element);

        // Then, if the element is an image, add the image preview at the top.
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'img') {
            const imageUrl = element.src;
            const imagePreviewHtml = `
                <div class="img-preview">
                    <div class="og-block">
                        <img src="${imageUrl}" class="og-image" alt="Selected Image">
                        <a href="${imageUrl}" target="_blank" download class="download-og-link">Скачать</a>
                    </div>
                </div>
            `;
            // Prepend the image preview to the existing content.
            inspectorContainer.innerHTML = imagePreviewHtml + inspectorContainer.innerHTML;
        }
    }

    function renderElementProperties(element) {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        const tagName = element.tagName.toLowerCase();
        const className = element.className.split(' ').filter(c => c).join('.');

        const elementWidth = Math.round(rect.width);
        const elementHeight = Math.round(rect.height);

        function createColorRow(label, color) {
            if (!color || color === 'rgba(0, 0, 0, 0)') {
                return '';
            }
            return `
                <div class="color-row">
                    <span class="info-label">${label}</span>
                    <div class="color-preview" style="background-color: ${color};"></div>
                    <span class="info-value">${color}</span>
                    <button class="copy-btn" data-clipboard-text="${color}" title="Скопировать цвет">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 4V16C8 17.1046 8.89543 18 10 18H20C21.1046 18 22 17.1046 22 16V4C22 2.89543 21.1046 2 20 2H10C8.89543 2 8 2.89543 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                </div>
            `;
        }

        inspectorContainer.innerHTML = `
            <div class="section-title">${tagName}${className ? '.' + className : ''}</div>
            
            <div class="info-row">
                <span class="info-label">Размеры:</span>
                <span class="info-value">${elementWidth}px × ${elementHeight}px</span>
            </div>
            <div class="info-row">
                <span class="info-label">Font Family:</span>
                <span class="info-value">${computedStyle.fontFamily}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Font Weight:</span>
                <span class="info-value">${computedStyle.fontWeight}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Размер шрифта:</span>
                <span class="info-value">${computedStyle.fontSize}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Интерлиньяж:</span>
                <span class="info-value">${computedStyle.lineHeight}</span>
            </div>
            ${createColorRow('Цвет текста', computedStyle.color)}
            ${createColorRow('Цвет фона', computedStyle.backgroundColor)}
            <div class="spacing-grid">
                <div class="spacing-item">
                    <div class="spacing-label">PADDING</div>
                    <div class="spacing-value">${computedStyle.padding}</div>
                </div>
                <div class="spacing-item">
                    <div class="spacing-label">MARGIN</div>
                    <div class="spacing-value">${computedStyle.margin}</div>
                </div>
            </div>
        `;

        inspectorContainer.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const textToCopy = button.dataset.clipboardText;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalContent = button.innerHTML;
                    button.innerHTML = '✓';
                    setTimeout(() => {
                        button.innerHTML = originalContent;
                    }, 1000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            });
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (!window.__inspectorInitialized || inspectorContainer.style.display === 'none' || pinnedElement) return;

        const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
        if (!elementUnder || panel.contains(elementUnder) || (pinToolbar && pinToolbar.contains(elementUnder))) return;

        const rect = elementUnder.getBoundingClientRect();
        highlightBox.style.left = rect.left + 'px';
        highlightBox.style.top = rect.top + 'px';
        highlightBox.style.width = rect.width + 'px';
        highlightBox.style.height = rect.height + 'px';
        highlightBox.style.opacity = 1;

        updateInspector(elementUnder);
    });

    document.addEventListener('click', (e) => {
        if (!window.__inspectorInitialized || inspectorContainer.style.display === 'none') return;
        
        const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
        if (!elementUnder || panel.contains(elementUnder) || (pinToolbar && pinToolbar.contains(elementUnder))) return;

        e.preventDefault();
        e.stopPropagation();

        pinnedElement = elementUnder;
        updateInspector(pinnedElement);
        createPinToolbar(pinnedElement);

    }, true);

    function createPinToolbar(element) {
        if (pinToolbar) {
            pinToolbar.remove();
        }

        pinToolbar = document.createElement('div');
        pinToolbar.className = 'pin-toolbar';
        
        const unpinButton = document.createElement('button');
        unpinButton.textContent = 'Снять выделение';
        unpinButton.onclick = (e) => {
            e.stopPropagation();
            pinnedElement = null;
            highlightBox.style.opacity = 0;
            if (pinToolbar) {
                pinToolbar.remove();
                pinToolbar = null;
            }
            inspectorContainer.innerHTML = '<div class="section-title">Выберите элемент</div><div style="color: #86868B;">Наведите курсор на элемент для просмотра информации</div>';
        };

        pinToolbar.appendChild(unpinButton);
        document.body.appendChild(pinToolbar);

        const rect = element.getBoundingClientRect();
        pinToolbar.style.left = `${rect.left}px`;
        pinToolbar.style.top = `${rect.bottom + 5}px`;
    }

    function renderImages() {
        imagesContainer.innerHTML = '<div class="section-title">Изображения на странице</div>';
        
        const imgs = Array.from(document.images)
            .map(img => img.src)
            .filter(src => src && src.startsWith('http'))
            .filter((src, index, arr) => arr.indexOf(src) === index);

        if (imgs.length === 0) {
            imagesContainer.innerHTML += '<div style="color: #86868B; text-align: center; padding: 20px;">На странице нет изображений.</div>';
            return;
        }

        imgs.forEach(src => {
            const wrapper = document.createElement('a');
            wrapper.className = 'media-item';
            wrapper.href = src;
            wrapper.target = '_blank';
            wrapper.style.display = 'block';
            wrapper.style.textDecoration = 'none';
            wrapper.style.color = 'inherit';

            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            img.onerror = () => {
                img.style.display = 'none';
            };

            const sizeSpan = document.createElement('span');
            sizeSpan.className = 'media-info';

            const naturalImg = new Image();
            naturalImg.onload = function () {
                const getImageFormat = (url) => {
                    const extension = url.split('.').pop().toLowerCase();
                    const formatMap = { 'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'gif': 'GIF', 'webp': 'WebP', 'svg': 'SVG', 'bmp': 'BMP', 'tiff': 'TIFF', 'ico': 'ICO' };
                    return formatMap[extension] || extension.toUpperCase();
                };
                
                const format = getImageFormat(src);
                
                fetch(src, { method: 'HEAD' })
                    .then(response => {
                        const fileSize = response.headers.get('content-length');
                        let sizeText = '';
                        
                        if (fileSize) {
                            const sizeInKB = Math.round(fileSize / 1024);
                            const sizeInMB = Math.round(fileSize / (1024 * 1024) * 10) / 10;
                            
                            if (sizeInMB >= 1) {
                                sizeText = ` • ${sizeInMB}MB`;
                            } else {
                                sizeText = ` • ${sizeInKB}KB`;
                            }
                        }
                        
                        sizeSpan.textContent = `${naturalImg.naturalWidth}px × ${naturalImg.naturalHeight}px • ${format}${sizeText}`;
                    })
                    .catch(() => {
                        sizeSpan.textContent = `${naturalImg.naturalWidth}px × ${naturalImg.naturalHeight}px • ${format}`;
                    });
            };
            naturalImg.onerror = function () {
                sizeSpan.textContent = '';
            };
            naturalImg.src = src;

            wrapper.appendChild(img);
            wrapper.appendChild(sizeSpan);

            imagesContainer.appendChild(wrapper);
        });
    }

    renderImages();

    const specialChars = [
        { char: '₽', name: 'Рубль' }, { char: 'м²', name: 'Кв. метр' }, { char: 'м³', name: 'Куб. метр' },
        { char: '«', name: 'Лев. кав.' }, { char: '»', name: 'Прав. кав.' }, { char: '–', name: 'Кор. тире' },
        { char: '—', name: 'Дл. тире' }, { char: '©', name: 'Копирайт' }, { char: '®', name: 'Рег. знак' },
        { char: '·', name: 'Пункт'}
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
    console.log('Инспектор создан, активна вкладка "Прицел"');
}

function removeInspector() {
    if (!window.__inspectorInitialized) return;

    console.log('Удаляем инспектор');

    if (overlayElements) {
        Object.values(overlayElements).forEach(el => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        });
    }
    if(pinToolbar) {
        pinToolbar.remove();
        pinToolbar = null;
    }
    pinnedElement = null;

    if (window.__inspectorEscHandler) {
        document.removeEventListener('keydown', window.__inspectorEscHandler);
        window.__inspectorEscHandler = null;
    }
    window.__inspectorInitialized = false;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Получено сообщение:', message);
    
    if (message.action === 'toggle_inspector') {
        if (window.__inspectorInitialized) {
            console.log('Выключаем инспектор');
            removeInspector();
            chrome.runtime.sendMessage({action: 'setIcon', active: false});
            sendResponse({ active: false });
        } else {
            console.log('Включаем инспектор');
            createInspector();
            chrome.runtime.sendMessage({action: 'setIcon', active: true});
            sendResponse({ active: true });
        }
    } else if (message.action === 'get_status') {
        const isActive = !!window.__inspectorInitialized;
        console.log('Запрос статуса, активен:', isActive);
        sendResponse({ active: isActive });
    } else if (message.action === 'clear_selection') {
        if (window.__inspectorInitialized) {
            pinnedElement = null;
            if (overlayElements && overlayElements.highlightBox) {
                overlayElements.highlightBox.style.opacity = 0;
            }
            if (pinToolbar) {
                pinToolbar.remove();
                pinToolbar = null;
            }
        }
    }
    return true;
});

// Clear selection when tab becomes hidden (e.g., user switches browser tabs)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.__inspectorInitialized) {
        pinnedElement = null;
        if (overlayElements && overlayElements.highlightBox) {
            overlayElements.highlightBox.style.opacity = 0;
        }
        if (pinToolbar) {
            pinToolbar.remove();
            pinToolbar = null;
        }
    }
});