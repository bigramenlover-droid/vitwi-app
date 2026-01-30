// Основная логика приложения

import { getUserData, getMessageText, showAlert, vibrate } from './telegram.js';
import { analyzeRecipe, getApiKey, generateRecipes } from './api.js';
import { initTheme, applyTheme, getThemesList } from './themes.js';

// Состояние приложения
let currentRecipeText = '';
let currentResults = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    
    // Проверяем пересланное сообщение несколько раз с задержками
    // так как параметры могут загружаться асинхронно
    checkForwardedMessage();
    setTimeout(() => {
        checkForwardedMessage();
    }, 300);
    setTimeout(() => {
        checkForwardedMessage();
    }, 1000);
});

// Инициализация приложения
async function initializeApp() {
    // Инициализация темы
    const currentTheme = initTheme();
    initThemeSelector();
    
    // Обновляем иконку темы
    updateThemeIcon(currentTheme);

    // Проверка API ключа (асинхронно)
    try {
        const apiKey = await getApiKey();
        if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY') {
            console.warn('API ключ не настроен. Настройте его в config.js');
            // Не показываем ошибку сразу, только при попытке анализа
        }
    } catch (error) {
        console.warn('Ошибка при загрузке конфигурации:', error);
    }

    // Получение данных пользователя
    const user = getUserData();
    if (user) {
        console.log('Пользователь:', user);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Переключение вкладок
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Кнопка анализа
    const analyzeRecipeBtn = document.getElementById('analyze-recipe');
    if (analyzeRecipeBtn) {
        analyzeRecipeBtn.addEventListener('click', () => {
            const text = document.getElementById('recipe-input').value.trim();
            if (text) {
                analyzeText(text);
            } else {
                showError('Введите или вставьте текст рецепта');
            }
        });
    }

    // Кнопка нового анализа
    const newAnalysisBtn = document.getElementById('new-analysis');
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', () => {
            resetApp();
        });
    }

    // Кнопка сохранения рецепта
    const saveRecipeBtn = document.getElementById('save-recipe');
    if (saveRecipeBtn) {
        saveRecipeBtn.addEventListener('click', () => {
            saveCurrentRecipe();
        });
    }

    // Поиск по тегам
    const tagSearchInput = document.getElementById('tag-search');
    if (tagSearchInput) {
        tagSearchInput.addEventListener('input', (e) => {
            filterRecipesByTags(e.target.value);
        });
    }

    // Кнопка "Добавить все ингредиенты в корзину"
    const addAllBtn = document.getElementById('add-all-ingredients');
    if (addAllBtn) {
        addAllBtn.addEventListener('click', () => {
            addAllIngredientsToCart();
        });
    }

    // Кнопка очистки корзины
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            clearCart();
        });
    }

    // Кнопка запроса к Вите
    const vitaAskBtn = document.getElementById('vita-ask');
    if (vitaAskBtn) {
        vitaAskBtn.addEventListener('click', () => {
            const query = document.getElementById('vita-query').value.trim();
            if (query) {
                askVita(query);
            } else {
                showError('Опишите, что вы хотите приготовить');
            }
        });
    }

    // Кнопка переключения темы
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            openThemeModal();
        });
    }

    // Закрытие модального окна темы
    const themeModalClose = document.getElementById('theme-modal-close');
    if (themeModalClose) {
        themeModalClose.addEventListener('click', () => {
            closeThemeModal();
        });
    }

    const themeModal = document.getElementById('theme-modal');
    if (themeModal) {
        themeModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-modal-overlay')) {
                closeThemeModal();
            }
        });
    }
}

// Инициализация селектора тем
function initThemeSelector() {
    const themesGrid = document.getElementById('themes-grid');
    if (!themesGrid) return;

    const themesList = getThemesList();
    const currentTheme = localStorage.getItem('vitwi-theme') || 'light';

    themesGrid.innerHTML = '';

    themesList.forEach(theme => {
        const themeCard = document.createElement('div');
        themeCard.className = `theme-card ${theme.key === currentTheme ? 'active' : ''}`;
        themeCard.dataset.theme = theme.key;
        
        themeCard.innerHTML = `
            <div class="theme-card-icon">${theme.icon}</div>
            <div class="theme-card-name">${theme.name}</div>
            <div class="theme-card-preview">
                <div class="theme-preview-color" style="background: ${theme.colors['--theme-primary']}"></div>
                <div class="theme-preview-color" style="background: ${theme.colors['--theme-success']}"></div>
                <div class="theme-preview-color" style="background: ${theme.colors['--theme-error']}"></div>
            </div>
        `;

        themeCard.addEventListener('click', () => {
            selectTheme(theme.key);
        });

        themesGrid.appendChild(themeCard);
    });
}

// Открытие модального окна выбора темы
function openThemeModal() {
    const modal = document.getElementById('theme-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        vibrate();
        
        // Обновляем активную тему
        const currentTheme = localStorage.getItem('vitwi-theme') || 'light';
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.dataset.theme === currentTheme);
        });
    }
}

// Закрытие модального окна выбора темы
function closeThemeModal() {
    const modal = document.getElementById('theme-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Обновление иконки темы
function updateThemeIcon(themeName) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        const theme = getThemesList().find(t => t.key === themeName);
        if (theme) {
            themeIcon.textContent = theme.icon;
        }
    }
}

// Выбор темы
function selectTheme(themeName) {
    applyTheme(themeName);
    vibrate();
    
    // Обновляем активную карточку
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.theme === themeName);
    });

    // Обновляем иконку кнопки
    updateThemeIcon(themeName);

    // Закрываем модальное окно через небольшую задержку для визуального эффекта
    setTimeout(() => {
        closeThemeModal();
    }, 300);
}

// Переключение вкладок
function switchTab(tabName) {
    // Убираем активный класс со всех вкладок и контента
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Активируем выбранную вкладку
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Скрываем результаты анализа при переключении вкладок (кроме вкладки ввода)
    if (tabName !== 'input') {
        hideResults();
        hideLoading();
    }
    
    // Скрываем результаты Виты при переключении вкладок (кроме вкладки Виты)
    if (tabName !== 'vita') {
        hideVitaResults();
        hideVitaLoading();
    }

    // Если открыли вкладку сохраненных, обновляем список
    if (tabName === 'saved') {
        loadSavedRecipes();
        updatePopularTags();
    }
    
    // Если открыли вкладку корзины, обновляем список
    if (tabName === 'cart') {
        loadCart();
    }

    vibrate();
}

// Флаг для предотвращения повторной обработки
let messageProcessed = false;

// Проверка пересланного сообщения
function checkForwardedMessage() {
    // Если уже обработали, не обрабатываем снова
    if (messageProcessed) {
        return;
    }
    
    const messageText = getMessageText();
    
    console.log('🔍 Проверка пересланного сообщения. Текст найден:', messageText ? 'да' : 'нет');
    if (messageText) {
        console.log('📝 Длина текста:', messageText.length, 'символов');
        console.log('📝 Первые 100 символов:', messageText.substring(0, 100));
    }
    
    if (messageText && messageText.trim().length > 0) {
        messageProcessed = true; // Помечаем как обработанное
        
        // Небольшая задержка для полной загрузки DOM
        setTimeout(() => {
            // Переключаемся на вкладку "Ввод рецепта"
            switchTab('input');
            
            // Вставляем текст в поле ввода
            const recipeInput = document.getElementById('recipe-input');
            if (recipeInput) {
                recipeInput.value = messageText;
                
                // Показываем уведомление
                showAlert('Текст рецепта загружен! Нажмите "Анализировать" для обработки.');
                
                // Прокручиваем к полю ввода
                setTimeout(() => {
                    recipeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    recipeInput.focus();
                }, 300);
            }
        }, 200);
    }
}

// Анализ текста рецепта
async function analyzeText(text) {
    if (!text || text.trim().length === 0) {
        showError('Текст рецепта не может быть пустым');
        return;
    }

    // Проверка API ключа перед анализом
    try {
        const apiKey = await getApiKey();
        if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY') {
            showError('Пожалуйста, настройте API ключ OpenRouter в файле config.js');
            return;
        }
    } catch (error) {
        showError('Ошибка при загрузке конфигурации. Проверьте настройки API ключа.');
        return;
    }

    currentRecipeText = text;
    
    // Показываем загрузку
    showLoading();
    hideResults();
    hideError();

    try {
        vibrate();
        
        // Вызываем API для анализа
        const results = await analyzeRecipe(text);
        currentResults = results;
        
        // Отображаем результаты
        displayResults(results);
        
    } catch (error) {
        console.error('Ошибка анализа:', error);
        showError(error.message || 'Произошла ошибка при анализе рецепта');
    } finally {
        hideLoading();
    }
}

// Отображение результатов
function displayResults(results) {
    // Название блюда
    document.getElementById('dish-name').textContent = results.dishName || 'Неизвестное блюдо';
    
    // Сложность приготовления
    const difficulty = results.difficulty || 'не указана';
    const difficultyValue = document.getElementById('difficulty-value');
    if (difficultyValue) {
        difficultyValue.textContent = difficulty;
        // Добавляем класс для стилизации
        difficultyValue.className = 'meta-value';
        if (difficulty.toLowerCase().includes('легк') || difficulty.toLowerCase().includes('прост')) {
            difficultyValue.classList.add('difficulty-easy');
        } else if (difficulty.toLowerCase().includes('средн') || difficulty.toLowerCase().includes('умерен')) {
            difficultyValue.classList.add('difficulty-medium');
        } else if (difficulty.toLowerCase().includes('сложн') || difficulty.toLowerCase().includes('трудн')) {
            difficultyValue.classList.add('difficulty-hard');
        }
    }
    
    // Время готовки
    const cookingTime = results.cookingTime || results.time || 'не указано';
    const timeValue = document.getElementById('time-value');
    if (timeValue) {
        timeValue.textContent = cookingTime;
    }

    // Пищевая ценность на 100 грамм
    const nutritionPer100g = results.nutritionPer100g || results.nutrition || {};
    document.getElementById('calories-100g').textContent = Math.round(nutritionPer100g.calories || 0);
    document.getElementById('proteins-100g').textContent = Math.round(nutritionPer100g.proteins || 0);
    document.getElementById('fats-100g').textContent = Math.round(nutritionPer100g.fats || 0);
    document.getElementById('carbs-100g').textContent = Math.round(nutritionPer100g.carbs || 0);

    // Пищевая ценность на порцию
    const nutritionPerServing = results.nutritionPerServing || {};
    const servings = results.servings || 1;
    
    // Обновляем заголовок с количеством порций
    const servingTitle = document.getElementById('serving-title');
    if (servings > 1) {
        servingTitle.textContent = `На порцию (${servings} порций):`;
    } else {
        servingTitle.textContent = 'На порцию:';
    }

    // Если есть данные на порцию, используем их, иначе рассчитываем из общих данных
    if (nutritionPerServing.calories) {
        document.getElementById('calories-serving').textContent = Math.round(nutritionPerServing.calories || 0);
        document.getElementById('proteins-serving').textContent = Math.round(nutritionPerServing.proteins || 0);
        document.getElementById('fats-serving').textContent = Math.round(nutritionPerServing.fats || 0);
        document.getElementById('carbs-serving').textContent = Math.round(nutritionPerServing.carbs || 0);
    } else {
        // Рассчитываем из общих данных, если нет данных на порцию
        const totalNutrition = results.nutrition || {};
        document.getElementById('calories-serving').textContent = Math.round((totalNutrition.calories || 0) / servings);
        document.getElementById('proteins-serving').textContent = Math.round((totalNutrition.proteins || 0) / servings);
        document.getElementById('fats-serving').textContent = Math.round((totalNutrition.fats || 0) / servings);
        document.getElementById('carbs-serving').textContent = Math.round((totalNutrition.carbs || 0) / servings);
    }

    // Ингредиенты
    const ingredientsList = document.getElementById('ingredients-list');
    ingredientsList.innerHTML = '';
    if (results.ingredients && Array.isArray(results.ingredients)) {
        results.ingredients.forEach((ingredient, index) => {
            const li = document.createElement('li');
            li.className = 'ingredient-item';
            
            const ingredientText = document.createElement('span');
            ingredientText.className = 'ingredient-text';
            ingredientText.textContent = ingredient;
            
            const addBtn = document.createElement('button');
            addBtn.className = 'btn-add-ingredient';
            addBtn.innerHTML = '➕';
            addBtn.title = 'Добавить в корзину';
            addBtn.onclick = () => {
                addToCart(ingredient);
            };
            
            li.appendChild(ingredientText);
            li.appendChild(addBtn);
            ingredientsList.appendChild(li);
        });
    }

    // Пошаговая инструкция
    const instructionsDiv = document.getElementById('instructions');
    instructionsDiv.innerHTML = '';
    if (results.instructions && Array.isArray(results.instructions)) {
        results.instructions.forEach(instruction => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step';
            
            const stepContent = `
                <div class="step-header">
                    <span class="step-number">${instruction.step || ''}</span>
                    <span class="step-title">${escapeHtml(instruction.title || '')}</span>
                </div>
                <div class="step-description">${escapeHtml(instruction.description || '')}</div>
            `;
            
            stepDiv.innerHTML = stepContent;
            instructionsDiv.appendChild(stepDiv);
        });
    }

    // Показываем результаты
    showResults();
    
    // Проверяем, сохранен ли рецепт
    checkIfRecipeSaved(results);
    
    // Прокручиваем к результатам
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Показать загрузку
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

// Скрыть загрузку
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// Показать результаты
function showResults() {
    document.getElementById('results').classList.remove('hidden');
}

// Скрыть результаты
function hideResults() {
    document.getElementById('results').classList.add('hidden');
}

// Показать загрузку Виты
function showVitaLoading() {
    document.getElementById('vita-loading').classList.remove('hidden');
}

// Скрыть загрузку Виты
function hideVitaLoading() {
    document.getElementById('vita-loading').classList.add('hidden');
}

// Показать результаты Виты
function showVitaResults() {
    document.getElementById('vita-results').classList.remove('hidden');
}

// Скрыть результаты Виты
function hideVitaResults() {
    document.getElementById('vita-results').classList.add('hidden');
}

// Запрос к Вите для генерации рецептов
async function askVita(query) {
    if (!query || query.trim().length === 0) {
        showError('Опишите, что вы хотите приготовить');
        return;
    }

    // Проверка API ключа
    try {
        const apiKey = await getApiKey();
        if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY') {
            showError('Пожалуйста, настройте API ключ OpenRouter в файле config.js');
            return;
        }
    } catch (error) {
        showError('Ошибка при загрузке конфигурации. Проверьте настройки API ключа.');
        return;
    }

    // Показываем загрузку
    showVitaLoading();
    hideVitaResults();
    hideError();

    try {
        vibrate();
        
        // Вызываем API для генерации рецептов
        const recipes = await generateRecipes(query);
        vitaRecipes = recipes; // Сохраняем для дальнейшего использования
        
        // Отображаем результаты
        displayVitaResults(recipes);
        
    } catch (error) {
        console.error('Ошибка генерации рецептов:', error);
        showError(error.message || 'Произошла ошибка при генерации рецептов');
    } finally {
        hideVitaLoading();
    }
}

// Отображение результатов от Виты
function displayVitaResults(recipes) {
    const resultsContainer = document.getElementById('vita-results');
    resultsContainer.innerHTML = '';

    if (!recipes || recipes.length === 0) {
        resultsContainer.innerHTML = '<p class="empty-message">Вита не смогла найти подходящие рецепты. Попробуйте изменить запрос.</p>';
        showVitaResults();
        return;
    }

    // Создаем карточки для каждого рецепта
    recipes.forEach((recipe, index) => {
        const recipeCard = createVitaRecipeCard(recipe, index);
        resultsContainer.appendChild(recipeCard);
    });

    showVitaResults();
    
    // Прокручиваем к результатам
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Создание карточки рецепта от Виты
function createVitaRecipeCard(recipe, index) {
    const card = document.createElement('div');
    card.className = 'vita-recipe-card';
    
    const nutrition100g = recipe.nutritionPer100g || {};
    const nutritionServing = recipe.nutritionPerServing || {};
    const servings = recipe.servings || 1;
    const difficulty = recipe.difficulty || 'не указана';
    const cookingTime = recipe.cookingTime || recipe.time || 'не указано';
    
    // Определяем класс для сложности
    let difficultyClass = '';
    if (difficulty.toLowerCase().includes('легк') || difficulty.toLowerCase().includes('прост')) {
        difficultyClass = 'difficulty-easy';
    } else if (difficulty.toLowerCase().includes('средн') || difficulty.toLowerCase().includes('умерен')) {
        difficultyClass = 'difficulty-medium';
    } else if (difficulty.toLowerCase().includes('сложн') || difficulty.toLowerCase().includes('трудн')) {
        difficultyClass = 'difficulty-hard';
    }

    // Формируем ингредиенты
    const ingredientsHtml = (recipe.ingredients || []).map((ing, ingIndex) => {
        const ingredientEscaped = escapeHtml(ing).replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `<li class="ingredient-item">
            <span class="ingredient-text">${escapeHtml(ing)}</span>
            <button class="btn-add-ingredient" onclick="addIngredientToCart('${ingredientEscaped}')" title="Добавить в корзину">➕</button>
        </li>`;
    }).join('');

    // Формируем инструкции
    const instructionsHtml = (recipe.instructions || []).map(inst => `
        <div class="step">
            <div class="step-header">
                <span class="step-number">${inst.step || ''}</span>
                <span class="step-title">${escapeHtml(inst.title || '')}</span>
            </div>
            <div class="step-description">${escapeHtml(inst.description || '')}</div>
        </div>
    `).join('');

    card.innerHTML = `
        <div class="vita-recipe-header">
            <h3 class="vita-recipe-name">${escapeHtml(recipe.dishName || 'Без названия')}</h3>
            <div class="vita-recipe-meta">
                <span class="vita-meta-item">
                    <span class="vita-meta-label">Сложность:</span>
                    <span class="vita-meta-value ${difficultyClass}">${escapeHtml(difficulty)}</span>
                </span>
                <span class="vita-meta-item">
                    <span class="vita-meta-label">Время:</span>
                    <span class="vita-meta-value">${escapeHtml(cookingTime)}</span>
                </span>
            </div>
        </div>
        
        <div class="vita-recipe-content">
            <!-- БЖУ -->
            <div class="vita-nutrition-card">
                <h4>📊 Пищевая ценность</h4>
                <div class="vita-nutrition-details">
                    <div class="vita-nutrition-row">
                        <span class="vita-nutrition-label">На 100г:</span>
                        <span class="vita-nutrition-values">
                            ${Math.round(nutrition100g.calories || 0)} ккал | 
                            Б: ${Math.round(nutrition100g.proteins || 0)}г | 
                            Ж: ${Math.round(nutrition100g.fats || 0)}г | 
                            У: ${Math.round(nutrition100g.carbs || 0)}г
                        </span>
                    </div>
                    ${nutritionServing.calories ? `
                    <div class="vita-nutrition-row">
                        <span class="vita-nutrition-label">На порцию (${servings}):</span>
                        <span class="vita-nutrition-values">
                            ${Math.round(nutritionServing.calories || 0)} ккал | 
                            Б: ${Math.round(nutritionServing.proteins || 0)}г | 
                            Ж: ${Math.round(nutritionServing.fats || 0)}г | 
                            У: ${Math.round(nutritionServing.carbs || 0)}г
                        </span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Ингредиенты -->
            ${ingredientsHtml ? `
            <div class="vita-recipe-section">
                <div class="ingredients-header">
                    <h4>🥘 Ингредиенты</h4>
                    <button class="btn btn-add-all" onclick="addAllIngredientsToCartFromVita(${index})">➕ Добавить все в корзину</button>
                </div>
                <ul class="ingredients-list">${ingredientsHtml}</ul>
            </div>
            ` : ''}

            <!-- Инструкции -->
            ${instructionsHtml ? `
            <div class="vita-recipe-section">
                <h4>👨‍🍳 Пошаговая инструкция</h4>
                <div class="instructions">${instructionsHtml}</div>
            </div>
            ` : ''}

            <!-- Кнопка сохранения -->
            <div class="vita-recipe-actions">
                <button class="btn btn-save" onclick="saveVitaRecipe(${index})">💾 Сохранить рецепт</button>
            </div>
        </div>
    `;

    return card;
}

// Сохранение рецепта от Виты
let vitaRecipes = [];

function saveVitaRecipe(index) {
    if (!vitaRecipes || !vitaRecipes[index]) {
        showError('Рецепт не найден');
        return;
    }

    const recipe = vitaRecipes[index];
    
    try {
        const savedRecipes = getSavedRecipes();
        
        // Проверяем, не сохранен ли уже этот рецепт
        const isDuplicate = savedRecipes.some(r => 
            r.dishName === recipe.dishName &&
            JSON.stringify(r.ingredients) === JSON.stringify(recipe.ingredients)
        );

        if (isDuplicate) {
            showAlert('Этот рецепт уже сохранен');
            return;
        }

        // Добавляем дату сохранения
        const recipeToSave = {
            ...recipe,
            savedAt: new Date().toISOString(),
            id: Date.now().toString() + '-' + index
        };

        savedRecipes.unshift(recipeToSave);
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        
        showAlert('Рецепт сохранен!');
        vibrate();
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showError('Не удалось сохранить рецепт');
    }
}

// Добавление всех ингредиентов из рецепта Виты в корзину
function addAllIngredientsToCartFromVita(index) {
    if (!vitaRecipes || !vitaRecipes[index]) {
        showError('Рецепт не найден');
        return;
    }

    const recipe = vitaRecipes[index];
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
            addIngredientToCart(ingredient);
        });
        showAlert(`Добавлено ${recipe.ingredients.length} ингредиентов в корзину!`);
        vibrate();
    }
}

// Добавление ингредиента в корзину (глобальная функция для использования в HTML)
function addIngredientToCart(ingredient) {
    addToCart(ingredient);
}

// Экспорт для глобального доступа
window.addIngredientToCart = addIngredientToCart;
window.saveVitaRecipe = saveVitaRecipe;
window.addAllIngredientsToCartFromVita = addAllIngredientsToCartFromVita;

// Показать ошибку
function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error').classList.remove('hidden');
    vibrate();
}

// Скрыть ошибку
function hideError() {
    document.getElementById('error').classList.add('hidden');
}

// Сброс приложения
function resetApp() {
    currentRecipeText = '';
    currentResults = null;
    
    // Очищаем поле ввода
    const recipeInput = document.getElementById('recipe-input');
    if (recipeInput) {
        recipeInput.value = '';
    }
    
    // Скрываем результаты
    hideResults();
    hideError();
    
    // Переключаемся на вкладку ввода
    switchTab('input');
    
    // Прокручиваем вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Сохранение рецепта
function saveCurrentRecipe() {
    if (!currentResults) {
        showError('Нет рецепта для сохранения');
        return;
    }

    try {
        const savedRecipes = getSavedRecipes();
        
        // Проверяем, не сохранен ли уже этот рецепт
        const isDuplicate = savedRecipes.some(recipe => 
            recipe.dishName === currentResults.dishName &&
            JSON.stringify(recipe.ingredients) === JSON.stringify(currentResults.ingredients)
        );

        if (isDuplicate) {
            showAlert('Этот рецепт уже сохранен');
            return;
        }

        // Добавляем дату сохранения
        const recipeToSave = {
            ...currentResults,
            savedAt: new Date().toISOString(),
            id: Date.now().toString()
        };

        savedRecipes.unshift(recipeToSave); // Добавляем в начало
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        
        showAlert('Рецепт сохранен!');
        vibrate();
        
        // Обновляем кнопку сохранения
        updateSaveButton(true);
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showError('Не удалось сохранить рецепт');
    }
}

// Получение сохраненных рецептов
function getSavedRecipes() {
    try {
        const saved = localStorage.getItem('savedRecipes');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Ошибка загрузки сохраненных рецептов:', error);
        return [];
    }
}

// Загрузка и отображение сохраненных рецептов
function loadSavedRecipes(searchQuery = '') {
    const savedRecipes = getSavedRecipes();
    const listContainer = document.getElementById('saved-recipes-list');

    if (savedRecipes.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">Нет сохраненных рецептов</p>';
        return;
    }

    // Фильтрация по поисковому запросу
    let filteredRecipes = savedRecipes;
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredRecipes = savedRecipes.filter(recipe => {
            const tags = (recipe.tags || []).map(t => t.toLowerCase());
            const dishName = (recipe.dishName || '').toLowerCase();
            
            // Поиск по тегам (с # или без)
            const tagMatch = tags.some(tag => tag.includes(query.replace('#', '')));
            // Поиск по названию
            const nameMatch = dishName.includes(query);
            
            return tagMatch || nameMatch;
        });
    }

    if (filteredRecipes.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">Рецепты не найдены</p>';
        return;
    }

    listContainer.innerHTML = '';
    
    filteredRecipes.forEach(recipe => {
        const recipeCard = createSavedRecipeCard(recipe);
        listContainer.appendChild(recipeCard);
    });
}

// Фильтрация рецептов по тегам
function filterRecipesByTags(searchQuery) {
    loadSavedRecipes(searchQuery);
}

// Обновление популярных тегов
function updatePopularTags() {
    const savedRecipes = getSavedRecipes();
    const popularTagsContainer = document.getElementById('popular-tags');
    
    if (!popularTagsContainer || savedRecipes.length === 0) {
        if (popularTagsContainer) {
            popularTagsContainer.innerHTML = '';
        }
        return;
    }

    // Собираем все теги и считаем частоту
    const tagCount = {};
    savedRecipes.forEach(recipe => {
        (recipe.tags || []).forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
    });

    // Сортируем по частоте и берем топ-10
    const popularTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

    if (popularTags.length === 0) {
        popularTagsContainer.innerHTML = '';
        return;
    }

    popularTagsContainer.innerHTML = `
        <div class="popular-tags-label">Популярные теги:</div>
        <div class="popular-tags-list">
            ${popularTags.map(tag => 
                `<span class="popular-tag" onclick="searchByTag('${escapeHtml(tag)}')">#${escapeHtml(tag)}</span>`
            ).join('')}
        </div>
    `;
}

// Поиск по тегу
function searchByTag(tag) {
    const searchInput = document.getElementById('tag-search');
    if (searchInput) {
        searchInput.value = tag;
        filterRecipesByTags(tag);
    }
}

// Экспорт для глобального доступа
window.searchByTag = searchByTag;

// Создание карточки сохраненного рецепта
function createSavedRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'saved-recipe-card';
    card.dataset.recipeId = recipe.id;
    
    const savedDate = new Date(recipe.savedAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    // Получаем данные о питательности
    const nutrition100g = recipe.nutritionPer100g || {};
    const nutritionServing = recipe.nutritionPerServing || {};
    const servings = recipe.servings || 1;
    
    // Получаем теги
    const tags = recipe.tags || [];
    const tagsHtml = tags.map(tag => `<span class="recipe-tag">#${escapeHtml(tag)}</span>`).join('');

    // Формируем ингредиенты с кнопками добавления в корзину
    const ingredientsHtml = (recipe.ingredients || []).map((ing, index) => {
        const ingredientText = escapeHtml(ing);
        return `
            <li class="ingredient-item">
                <span class="ingredient-text">${ingredientText}</span>
                <button class="btn-add-ingredient" onclick="addIngredientToCartFromSaved('${recipe.id}', ${index})" title="Добавить в корзину">➕</button>
            </li>
        `;
    }).join('');

    // Формируем инструкции
    const instructionsHtml = (recipe.instructions || []).map(inst => `
        <div class="step">
            <div class="step-header">
                <span class="step-number">${inst.step || ''}</span>
                <span class="step-title">${escapeHtml(inst.title || '')}</span>
            </div>
            <div class="step-description">${escapeHtml(inst.description || '')}</div>
        </div>
    `).join('');

    // Получаем сложность и время
    const difficulty = recipe.difficulty || 'не указана';
    const cookingTime = recipe.cookingTime || recipe.time || 'не указано';
    
    // Определяем класс для сложности
    let difficultyClass = '';
    if (difficulty.toLowerCase().includes('легк') || difficulty.toLowerCase().includes('прост')) {
        difficultyClass = 'difficulty-easy';
    } else if (difficulty.toLowerCase().includes('средн') || difficulty.toLowerCase().includes('умерен')) {
        difficultyClass = 'difficulty-medium';
    } else if (difficulty.toLowerCase().includes('сложн') || difficulty.toLowerCase().includes('трудн')) {
        difficultyClass = 'difficulty-hard';
    }

    card.innerHTML = `
        <div class="saved-recipe-header" onclick="toggleRecipeCard(this)">
            <div class="saved-recipe-title-section">
                <h3 class="saved-recipe-name">${escapeHtml(recipe.dishName || 'Без названия')}</h3>
                <div class="saved-recipe-tags">${tagsHtml}</div>
            </div>
            <div class="saved-recipe-actions">
                <button class="btn-toggle" title="Развернуть/Свернуть">▼</button>
                <button class="btn-delete" data-id="${recipe.id}" title="Удалить">🗑️</button>
            </div>
        </div>
        <div class="saved-recipe-content">
            <div class="saved-recipe-info">
                <div class="saved-nutrition-mini">
                    <span>🔥 ${Math.round(nutrition100g.calories || 0)} ккал/100г</span>
                    <span>🥩 ${Math.round(nutrition100g.proteins || 0)}г Б</span>
                    <span>🧈 ${Math.round(nutrition100g.fats || 0)}г Ж</span>
                    <span>🍞 ${Math.round(nutrition100g.carbs || 0)}г У</span>
                </div>
                <div class="saved-recipe-meta">
                    <span class="saved-meta-item">
                        <span class="saved-meta-label">Сложность:</span>
                        <span class="saved-meta-value ${difficultyClass}">${escapeHtml(difficulty)}</span>
                    </span>
                    <span class="saved-meta-item">
                        <span class="saved-meta-label">Время:</span>
                        <span class="saved-meta-value">${escapeHtml(cookingTime)}</span>
                    </span>
                </div>
                <p class="saved-date">Сохранено: ${savedDate}</p>
            </div>
            
            <!-- Полная информация о рецепте -->
            <div class="saved-recipe-full-info">
                <!-- БЖУ подробно -->
                <div class="saved-nutrition-card">
                    <h4>📊 Пищевая ценность</h4>
                    <div class="saved-nutrition-details">
                        <div class="saved-nutrition-row">
                            <span class="saved-nutrition-label">На 100г:</span>
                            <span class="saved-nutrition-values">
                                ${Math.round(nutrition100g.calories || 0)} ккал | 
                                Б: ${Math.round(nutrition100g.proteins || 0)}г | 
                                Ж: ${Math.round(nutrition100g.fats || 0)}г | 
                                У: ${Math.round(nutrition100g.carbs || 0)}г
                            </span>
                        </div>
                        ${nutritionServing.calories ? `
                        <div class="saved-nutrition-row">
                            <span class="saved-nutrition-label">На порцию (${servings}):</span>
                            <span class="saved-nutrition-values">
                                ${Math.round(nutritionServing.calories || 0)} ккал | 
                                Б: ${Math.round(nutritionServing.proteins || 0)}г | 
                                Ж: ${Math.round(nutritionServing.fats || 0)}г | 
                                У: ${Math.round(nutritionServing.carbs || 0)}г
                            </span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Ингредиенты -->
                ${ingredientsHtml ? `
                <div class="saved-recipe-section">
                    <div class="ingredients-header">
                        <h4>🥘 Ингредиенты</h4>
                        <button class="btn btn-add-all" onclick="addAllIngredientsToCartFromSaved('${recipe.id}')">➕ Добавить все в корзину</button>
                    </div>
                    <ul class="saved-ingredients-list">${ingredientsHtml}</ul>
                </div>
                ` : ''}

                <!-- Инструкции -->
                ${instructionsHtml ? `
                <div class="saved-recipe-section">
                    <h4>👨‍🍳 Пошаговая инструкция</h4>
                    <div class="saved-instructions">${instructionsHtml}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    // Обработчик удаления
    card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSavedRecipe(recipe.id);
    });

    // Обработчик сворачивания/разворачивания
    const toggleBtn = card.querySelector('.btn-toggle');
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleRecipeCard(card.querySelector('.saved-recipe-header'));
    });

    // Изначально свернуто
    card.classList.add('collapsed');

    return card;
}

// Переключение сворачивания/разворачивания карточки
function toggleRecipeCard(header) {
    const card = header.closest('.saved-recipe-card');
    const content = card.querySelector('.saved-recipe-content');
    const toggleBtn = card.querySelector('.btn-toggle');
    
    // Закрываем модальное окно выбора темы, если оно открыто
    closeThemeModal();
    
    if (card.classList.contains('collapsed')) {
        card.classList.remove('collapsed');
        toggleBtn.textContent = '▲';
    } else {
        card.classList.add('collapsed');
        toggleBtn.textContent = '▼';
    }
}

// Экспорт для глобального доступа
window.toggleRecipeCard = toggleRecipeCard;

// Просмотр сохраненного рецепта (теперь просто разворачивает карточку)
function viewSavedRecipe(recipe) {
    // Находим карточку рецепта
    const card = document.querySelector(`[data-recipe-id="${recipe.id}"]`);
    if (card && card.classList.contains('collapsed')) {
        // Разворачиваем карточку
        const header = card.querySelector('.saved-recipe-header');
        toggleRecipeCard(header);
        
        // Прокручиваем к карточке
        setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Удаление сохраненного рецепта
function deleteSavedRecipe(recipeId) {
    if (!confirm('Удалить этот рецепт из сохраненных?')) {
        return;
    }

    try {
        const savedRecipes = getSavedRecipes();
        const filtered = savedRecipes.filter(recipe => recipe.id !== recipeId);
        localStorage.setItem('savedRecipes', JSON.stringify(filtered));
        
        loadSavedRecipes();
        vibrate();
        showAlert('Рецепт удален');
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showError('Не удалось удалить рецепт');
    }
}

// Проверка, сохранен ли текущий рецепт
function checkIfRecipeSaved(recipe) {
    if (!recipe) return;
    
    const savedRecipes = getSavedRecipes();
    const isSaved = savedRecipes.some(saved => 
        saved.dishName === recipe.dishName &&
        JSON.stringify(saved.ingredients) === JSON.stringify(recipe.ingredients)
    );
    
    updateSaveButton(isSaved);
}

// Обновление кнопки сохранения
function updateSaveButton(isSaved) {
    const saveBtn = document.getElementById('save-recipe');
    if (isSaved) {
        saveBtn.textContent = '✓ Сохранено';
        saveBtn.classList.add('saved');
        saveBtn.disabled = true;
    } else {
        saveBtn.textContent = '💾 Сохранить рецепт';
        saveBtn.classList.remove('saved');
        saveBtn.disabled = false;
    }
}


// ==================== КОРЗИНА ПРОДУКТОВ ====================

// Получение корзины из localStorage
function getCart() {
    try {
        const cart = localStorage.getItem('shoppingCart');
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        return [];
    }
}

// Сохранение корзины в localStorage
function saveCart(cart) {
    try {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
    } catch (error) {
        console.error('Ошибка сохранения корзины:', error);
    }
}

// Добавление продукта в корзину
function addToCart(ingredient) {
    if (!ingredient || ingredient.trim().length === 0) {
        return;
    }

    const cart = getCart();
    
    // Проверяем, нет ли уже такого продукта
    const existingIndex = cart.findIndex(item => 
        item.name.toLowerCase().trim() === ingredient.toLowerCase().trim()
    );

    if (existingIndex >= 0) {
        // Если продукт уже есть, не добавляем дубликат
        showAlert('Этот продукт уже в корзине');
        vibrate();
        return;
    }

    // Добавляем новый продукт
    const newItem = {
        id: Date.now().toString(),
        name: ingredient.trim(),
        purchased: false,
        addedAt: new Date().toISOString()
    };

    cart.push(newItem);
    saveCart(cart);
    
    showAlert('Продукт добавлен в корзину!');
    vibrate();
    
    // Обновляем отображение корзины, если она открыта
    const cartTab = document.getElementById('cart-tab');
    if (cartTab && cartTab.classList.contains('active')) {
        loadCart();
    }
}

// Добавление всех ингредиентов в корзину
function addAllIngredientsToCart() {
    if (!currentResults || !currentResults.ingredients) {
        showError('Нет ингредиентов для добавления');
        return;
    }

    const ingredients = currentResults.ingredients;
    let addedCount = 0;
    const cart = getCart();

    ingredients.forEach(ingredient => {
        const ingredientName = ingredient.trim();
        if (ingredientName.length === 0) return;

        // Проверяем, нет ли уже такого продукта
        const exists = cart.some(item => 
            item.name.toLowerCase().trim() === ingredientName.toLowerCase().trim()
        );

        if (!exists) {
            const newItem = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: ingredientName,
                purchased: false,
                addedAt: new Date().toISOString()
            };
            cart.push(newItem);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveCart(cart);
        showAlert(`Добавлено ${addedCount} продуктов в корзину!`);
        vibrate();
        
        // Обновляем отображение корзины, если она открыта
        const cartTab = document.getElementById('cart-tab');
        if (cartTab && cartTab.classList.contains('active')) {
            loadCart();
        }
    } else {
        showAlert('Все продукты уже в корзине');
    }
}

// Загрузка и отображение корзины
function loadCart() {
    const cart = getCart();
    const cartList = document.getElementById('cart-list');

    if (!cartList) return;

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="empty-message">Корзина пуста</p>';
        return;
    }

    cartList.innerHTML = '';

    // Разделяем на купленные и некупленные
    const purchased = cart.filter(item => item.purchased);
    const notPurchased = cart.filter(item => !item.purchased);

    // Сначала показываем некупленные
    if (notPurchased.length > 0) {
        notPurchased.forEach(item => {
            const cartItem = createCartItem(item);
            cartList.appendChild(cartItem);
        });
    }

    // Затем показываем купленные (если есть)
    if (purchased.length > 0) {
        const purchasedSection = document.createElement('div');
        purchasedSection.className = 'cart-section-divider';
        purchasedSection.innerHTML = '<h4 class="cart-section-title">✓ Куплено</h4>';
        cartList.appendChild(purchasedSection);

        purchased.forEach(item => {
            const cartItem = createCartItem(item);
            cartList.appendChild(cartItem);
        });
    }
}

// Создание элемента корзины
function createCartItem(item) {
    const cartItem = document.createElement('div');
    cartItem.className = `cart-item ${item.purchased ? 'purchased' : ''}`;
    cartItem.dataset.itemId = item.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'cart-checkbox';
    checkbox.checked = item.purchased;
    checkbox.onchange = () => {
        toggleCartItem(item.id);
    };

    const itemName = document.createElement('span');
    itemName.className = 'cart-item-name';
    itemName.textContent = item.name;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-item';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Удалить из корзины';
    deleteBtn.onclick = () => {
        removeFromCart(item.id);
    };

    cartItem.appendChild(checkbox);
    cartItem.appendChild(itemName);
    cartItem.appendChild(deleteBtn);

    return cartItem;
}

// Переключение статуса покупки продукта
function toggleCartItem(itemId) {
    const cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === itemId);

    if (itemIndex >= 0) {
        cart[itemIndex].purchased = !cart[itemIndex].purchased;
        saveCart(cart);
        loadCart();
        vibrate();
    }
}

// Удаление продукта из корзины
function removeFromCart(itemId) {
    const cart = getCart();
    const filtered = cart.filter(item => item.id !== itemId);
    saveCart(filtered);
    loadCart();
    vibrate();
    showAlert('Продукт удален из корзины');
}

// Очистка корзины
function clearCart() {
    if (!confirm('Очистить всю корзину?')) {
        return;
    }

    saveCart([]);
    loadCart();
    vibrate();
    showAlert('Корзина очищена');
}

// Добавление ингредиента в корзину из сохраненного рецепта
function addIngredientToCartFromSaved(recipeId, ingredientIndex) {
    const savedRecipes = getSavedRecipes();
    const recipe = savedRecipes.find(r => r.id === recipeId);
    
    if (!recipe || !recipe.ingredients || !recipe.ingredients[ingredientIndex]) {
        showError('Ингредиент не найден');
        return;
    }
    
    const ingredient = recipe.ingredients[ingredientIndex];
    addToCart(ingredient);
}

// Добавление всех ингредиентов в корзину из сохраненного рецепта
function addAllIngredientsToCartFromSaved(recipeId) {
    const savedRecipes = getSavedRecipes();
    const recipe = savedRecipes.find(r => r.id === recipeId);
    
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
        showError('Ингредиенты не найдены');
        return;
    }
    
    let addedCount = 0;
    const cart = getCart();

    recipe.ingredients.forEach(ingredient => {
        const ingredientName = ingredient.trim();
        if (ingredientName.length === 0) return;

        // Проверяем, нет ли уже такого продукта
        const exists = cart.some(item => 
            item.name.toLowerCase().trim() === ingredientName.toLowerCase().trim()
        );

        if (!exists) {
            const newItem = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: ingredientName,
                purchased: false,
                addedAt: new Date().toISOString()
            };
            cart.push(newItem);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveCart(cart);
        showAlert(`Добавлено ${addedCount} продуктов в корзину!`);
        vibrate();
        
        // Обновляем отображение корзины, если она открыта
        const cartTab = document.getElementById('cart-tab');
        if (cartTab && cartTab.classList.contains('active')) {
            loadCart();
        }
    } else {
        showAlert('Все продукты уже в корзине');
    }
}

// Экспорт функций для глобального доступа
window.hideError = hideError;
window.addIngredientToCartFromSaved = addIngredientToCartFromSaved;
window.addAllIngredientsToCartFromSaved = addAllIngredientsToCartFromSaved;

