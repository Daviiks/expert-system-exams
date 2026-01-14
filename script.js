let questions = [];
let currentQuestion = 0;
let studiedQuestions = new Set();
let touchStartX = 0;
let touchEndX = 0;

// Загрузка данных
async function loadQuestions() {
    try {
        const response = await fetch('data.json');
        questions = await response.json();
        initApp();
    } catch (error) {
        console.error('Ошибка загрузки вопросов:', error);
        document.getElementById('question').textContent = 
            'Ошибка загрузки данных. Проверьте файл data.json';
    }
}

// Инициализация приложения
function initApp() {
    loadProgress();
    updateQuestion();
    setupEventListeners();
    populateTopics();
    setupMobileFeatures();
    updateMobileHint();
}

// Настройка мобильных функций
function setupMobileFeatures() {
    // Определяем мобильное устройство
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Показываем подсказку о свайпах
        const hint = document.createElement('div');
        hint.className = 'swipe-hint';
        hint.id = 'swipeHint';
        hint.innerHTML = '👆 Свайп влево/вправо для навигации';
        document.querySelector('.controls').after(hint);
        document.getElementById('swipeHint').style.display = 'block';
        
        // Добавляем вибрацию при переходе (если поддерживается)
        if (navigator.vibrate) {
            window.vibrateEnabled = true;
        }
    }
}

// Обновление подсказки для мобильных
function updateMobileHint() {
    const hint = document.getElementById('swipeHint');
    if (hint) {
        // Скрываем подсказку после 5 просмотренных вопросов
        if (studiedQuestions.size > 5) {
            hint.style.opacity = '0.5';
            setTimeout(() => {
                if (hint) hint.style.display = 'none';
            }, 3000);
        }
    }
}

// Обновление отображения вопроса
function updateQuestion() {
    if (questions.length === 0) return;
    
    const question = questions[currentQuestion];
    document.getElementById('question').textContent = 
        `${question.id}. ${question.question}`;
    document.getElementById('answer').textContent = question.answer;
    
    // Обновление счетчика
    document.getElementById('counter').textContent = 
        `Вопрос ${currentQuestion + 1} из ${questions.length}`;
    
    // Обновление прогресса
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    
    // Обновление статистики
    document.getElementById('studiedCount').textContent = studiedQuestions.size;
    
    // Отметка изученного вопроса
    const card = document.querySelector('.card');
    if (studiedQuestions.has(question.id)) {
        card.classList.add('studied');
    } else {
        card.classList.remove('studied');
    }
    
    // Обновляем мобильную подсказку
    updateMobileHint();
    
    // Прокрутка к верху (для мобильных)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Вибрация на мобильных (короткая)
    if (window.vibrateEnabled) {
        navigator.vibrate(20);
    }
}

// Навигация
function nextQuestion() {
    markAsStudied();
    currentQuestion = (currentQuestion + 1) % questions.length;
    updateQuestion();
}

function prevQuestion() {
    markAsStudied();
    currentQuestion = (currentQuestion - 1 + questions.length) % questions.length;
    updateQuestion();
}

function randomQuestion() {
    markAsStudied();
    const oldQuestion = currentQuestion;
    do {
        currentQuestion = Math.floor(Math.random() * questions.length);
    } while (currentQuestion === oldQuestion && questions.length > 1);
    updateQuestion();
}

// Отметить вопрос как изученный
function markAsStudied() {
    const question = questions[currentQuestion];
    studiedQuestions.add(question.id);
    saveProgress();
}

// Обработка свайпов для мобильных
function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50; // Минимальная длина свайпа в пикселях
    
    if (touchEndX < touchStartX - swipeThreshold) {
        // Свайп влево = следующий вопрос
        nextQuestion();
    }
    
    if (touchEndX > touchStartX + swipeThreshold) {
        // Свайп вправо = предыдущий вопрос
        prevQuestion();
    }
}

// Поиск
function searchQuestions() {
    markAsStudied();
    const searchText = document.getElementById('search').value.toLowerCase();
    const topic = document.getElementById('topicFilter').value;
    
    const filtered = questions.filter(q => {
        const matchesSearch = q.question.toLowerCase().includes(searchText) || 
                            q.answer.toLowerCase().includes(searchText);
        const matchesTopic = !topic || q.topic === topic;
        return matchesSearch && matchesTopic;
    });
    
    if (filtered.length > 0) {
        currentQuestion = questions.indexOf(filtered[0]);
        updateQuestion();
    }
}

// Заполнение тем
function populateTopics() {
    const topics = [...new Set(questions.map(q => q.topic))];
    const select = document.getElementById('topicFilter');
    
    // Очищаем, кроме первого option
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        select.appendChild(option);
    });
}

// Сохранение прогресса
function saveProgress() {
    localStorage.setItem('studiedQuestions', JSON.stringify([...studiedQuestions]));
    localStorage.setItem('lastQuestion', currentQuestion.toString());
}

function loadProgress() {
    const saved = localStorage.getItem('studiedQuestions');
    if (saved) {
        studiedQuestions = new Set(JSON.parse(saved));
    }
    
    const lastQuestion = localStorage.getItem('lastQuestion');
    if (lastQuestion) {
        currentQuestion = parseInt(lastQuestion);
    }
}

function resetProgress() {
    if (confirm('Сбросить весь прогресс изученных вопросов?')) {
        studiedQuestions.clear();
        localStorage.removeItem('studiedQuestions');
        localStorage.removeItem('lastQuestion');
        updateQuestion();
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('prevBtn').addEventListener('click', prevQuestion);
    document.getElementById('randomBtn').addEventListener('click', randomQuestion);
    document.getElementById('resetBtn').addEventListener('click', resetProgress);
    
    // Свайпы для мобильных
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Поиск
    document.getElementById('search').addEventListener('input', searchQuestions);
    document.getElementById('topicFilter').addEventListener('change', searchQuestions);
    
    // Сохранение позиции при закрытии
    window.addEventListener('beforeunload', saveProgress);
    
    // Горячие клавиши
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            nextQuestion();
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevQuestion();
        }
        if (e.key === 'r' || e.key === 'к' || e.key === 'R') {
            e.preventDefault();
            randomQuestion();
        }
    });
    
    // Обработка изменения ориентации экрана
    window.addEventListener('orientationchange', () => {
        // Небольшая задержка для перерисовки
        setTimeout(updateQuestion, 100);
    });
    
    // Предотвращение масштабирования при двойном тапе (опционально)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// Запуск приложения
loadQuestions();

// Service Worker для оффлайн-работы (опционально)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}