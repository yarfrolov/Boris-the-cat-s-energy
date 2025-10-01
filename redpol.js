let currentMatchIndex = 0;
let allMatches = [];

const searchInput = document.getElementById('searchInput');
const resetBtn = document.getElementById('resetBtn');

searchInput.addEventListener('input', () => {
  if (searchInput.value.length > 0) {
    resetBtn.style.display = 'block';
  } else {
    resetBtn.style.display = 'none';
  }
});

resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  highlightSearch();
  resetBtn.style.display = 'none';
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[.]]/g, '\$&');
}

function highlightSearch() {
  const filter = searchInput.value.trim().toLowerCase();
  const searchControls = document.getElementById('searchControls');
  
  if (searchInput.value.length > 0) {
    resetBtn.style.display = 'block';
  } else {
    resetBtn.style.display = 'none';
  }

  if (!filter) {
    removeHighlights(document.body);
    searchControls.style.display = 'none';
    allMatches = [];
    currentMatchIndex = 0;
    return;
  }
  
  removeHighlights(document.body);
  allMatches = [];
  currentMatchIndex = 0;
  
  // Находим все совпадения
  findAllMatches(document.body, filter);
  
  if (allMatches.length > 0) {
    searchControls.style.display = 'flex';
    updateSearchCounter();
    navigateToMatch(0);
  } else {
    searchControls.style.display = 'none';
  }
}

function findAllMatches(element, filter) {
  if (element.nodeType === 3) { // Text node
    const text = element.nodeValue.toLowerCase();
    const index = text.indexOf(filter);
    if (index >= 0 && element.parentNode.nodeName !== 'MARK') {
      const span = document.createElement('mark');
      const matchedText = element.splitText(index);
      matchedText.nodeValue = matchedText.nodeValue.substring(filter.length);
      const highlightedText = matchedText.cloneNode(true);
      span.appendChild(document.createTextNode(filter));
      matchedText.parentNode.replaceChild(span, matchedText);
      span.appendChild(highlightedText);
      allMatches.push(span);
    }
  } else if (element.nodeType === 1 && element.childNodes && !['SCRIPT', 'STYLE', 'MARK', 'INPUT'].includes(element.tagName)) {
    for (let i = 0; i < element.childNodes.length; i++) {
      findAllMatches(element.childNodes[i], filter);
    }
  }
}

function navigateSearch(direction) {
  if (allMatches.length === 0) return; 
  
  currentMatchIndex += direction;
  
  if (currentMatchIndex < 0) {
    currentMatchIndex = allMatches.length - 1;
  } else if (currentMatchIndex >= allMatches.length) {
    currentMatchIndex = 0;
  }
  
  navigateToMatch(currentMatchIndex);
  updateSearchCounter();
}

function navigateToMatch(index) {
  if (allMatches[index]) {
    allMatches[index].scrollIntoView({
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Убираем предыдущее выделение
    allMatches.forEach(match => {
      match.style.backgroundColor = '';
    });
    
    // Добавляем выделение к текущему совпадению
    allMatches[index].style.backgroundColor = '#ff6b6b';
    setTimeout(() => {
      allMatches[index].style.backgroundColor = '';
    }, 2000);
  }
}

function updateSearchCounter() {
  const counter = document.getElementById('searchCounter');
  counter.textContent = `${currentMatchIndex + 1} из ${allMatches.length}`;
}
function removeHighlights(element) {
  const marks = element.querySelectorAll('mark');
  marks.forEach(mark => {
    let parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}
