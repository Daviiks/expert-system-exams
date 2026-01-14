let questions = [];
let currentQuestion = 0;
let studiedQuestions = new Set();

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
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('prevBtn').addEventListener('click', prevQuestion);
    document.getElementById('randomBtn').addEventListener('click', randomQuestion);
    document.getElementById('resetBtn').addEventListener('click', resetProgress);
    
    // Поиск
    document.getElementById('search').addEventListener('input', searchQuestions);
    document.getElementById('topicFilter').addEventListener('change', searchQuestions);
    
    // Сохранение позиции при закрытии
    window.addEventListener('beforeunload', saveProgress);
    
    // Горячие клавиши
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') {
            nextQuestion();
        }
        if (e.key === 'ArrowLeft') {
            prevQuestion();
        }
        if (e.key === 'r' || e.key === 'к' || e.key === 'R') {
            randomQuestion();
        }
    });
}

// Запуск приложения
loadQuestions();