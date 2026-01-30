// Работа с OpenRouter API для распознавания рецептов

import { CONFIG } from '../config.js';

const OPENROUTER_API_KEY = CONFIG.OPENROUTER_API_KEY;
const OPENROUTER_URL = CONFIG.OPENROUTER_URL;
const MODEL = CONFIG.MODEL;

/**
 * Анализ рецепта через нейросеть
 * @param {string} recipeText - Текст рецепта
 * @returns {Promise<Object>} - Результат анализа с БЖУ, калориями и инструкцией
 */
export async function analyzeRecipe(recipeText) {
    if (!recipeText || recipeText.trim().length === 0) {
        throw new Error('Текст рецепта не может быть пустым');
    }

    const prompt = `Ты - эксперт по кулинарии и диетологии с глубокими знаниями пищевой ценности продуктов и методов приготовления. Проанализируй следующий рецепт блюда и предоставь информацию в строго определенном JSON формате.

Текст рецепта:
${recipeText}

ВАЖНЫЕ ТРЕБОВАНИЯ К АНАЛИЗУ:

1. НАЗВАНИЕ БЛЮДА: Определи точное название блюда на основе рецепта.

2. ИНГРЕДИЕНТЫ: Извлеки ВСЕ ингредиенты с ТОЧНЫМ указанием количества (в граммах, миллилитрах, штуках и т.д.). Если количество не указано, оцени его на основе стандартных порций.

3. РАСЧЕТ КБЖУ (КРИТИЧЕСКИ ВАЖНО):
   - Рассчитай КБЖУ для КАЖДОГО ингредиента с учетом:
     * Точного количества в рецепте
     * Способа приготовления (варка, жарка, запекание и т.д.) - это влияет на калорийность!
     * Изменений при тепловой обработке (испарение воды, впитывание масла и т.д.)
   - Рассчитай ОБЩУЮ массу готового блюда (сумма всех ингредиентов после приготовления)
   - Рассчитай КБЖУ на 100 грамм готового блюда (раздели общие значения на общую массу и умножь на 100)
   - Рассчитай КБЖУ на одну порцию (раздели общие значения на количество порций)
   - Используй актуальные данные о пищевой ценности продуктов
   - Учитывай потери при готовке (испарение, впитывание масла при жарке и т.д.)

4. СЛОЖНОСТЬ ПРИГОТОВЛЕНИЯ:
   - Оцени сложность приготовления блюда по шкале: "Легко", "Средне", "Сложно"
   - Учитывай количество ингредиентов, сложность техник, необходимость специальных навыков
   - "Легко" - простые блюда для начинающих (салаты, простые супы, бутерброды)
   - "Средне" - блюда средней сложности (жареные блюда, запеканки, пироги)
   - "Сложно" - сложные блюда, требующие опыта (многоэтапные блюда, выпечка, сложные соусы)

5. ВРЕМЯ ГОТОВКИ:
   - Укажи общее время приготовления блюда в формате: "X минут" или "X часов Y минут"
   - Учитывай время подготовки ингредиентов, время готовки и время ожидания (маринование, подъем теста и т.д.)
   - Указывай реальное время, которое потребуется для приготовления

6. ПОШАГОВАЯ ИНСТРУКЦИЯ:
   - Разбей процесс на МНОГО мелких шагов (минимум 8-12 шагов для сложных блюд)
   - Пиши ПРОСТЫМ, понятным языком, как будто объясняешь другу
   - Каждый шаг должен быть конкретным и выполнимым
   - Сохраняй техническую суть, но объясняй доступно
   - Указывай точное время, температуру, степень готовности где это важно
   - Включай важные детали (как нарезать, какой огонь, когда помешивать и т.д.)

7. ТЕГИ:
   - Создай 3-7 релевантных тегов для этого рецепта
   - Теги должны отражать: основной ингредиент (мясо, рыба, овощи и т.д.), способ приготовления (жарка, варка, запекание), тип блюда (суп, салат, десерт и т.д.)
   - Используй простые, понятные слова на русском языке
   - Формат тегов: без символа #, только слова (например: ["свинина", "жарка", "второе"])

Верни ответ ТОЛЬКО в формате JSON без дополнительных комментариев:
{
  "dishName": "Название блюда",
  "servings": число_порций,
  "totalWeight": общая_масса_готового_блюда_в_граммах,
  "difficulty": "Легко" или "Средне" или "Сложно",
  "cookingTime": "X минут" или "X часов Y минут",
  "ingredients": [
    "ингредиент 1 с точным количеством",
    "ингредиент 2 с точным количеством"
  ],
  "nutritionPer100g": {
    "calories": число_ккал_на_100г,
    "proteins": число_г_белков_на_100г,
    "fats": число_г_жиров_на_100г,
    "carbs": число_г_углеводов_на_100г
  },
  "nutritionPerServing": {
    "calories": число_ккал_на_порцию,
    "proteins": число_г_белков_на_порцию,
    "fats": число_г_жиров_на_порцию,
    "carbs": число_г_углеводов_на_порцию
  },
  "nutrition": {
    "calories": общее_количество_ккал_в_блюде,
    "proteins": общее_количество_г_белков,
    "fats": общее_количество_г_жиров,
    "carbs": общее_количество_г_углеводов
  },
  "instructions": [
    {
      "step": 1,
      "title": "Краткое название этапа (простыми словами)",
      "description": "Подробное, простое описание этого этапа. Объясняй как другу, но сохраняй точность."
    }
  ],
  "tags": ["тег1", "тег2", "тег3"]
}`;

    try {
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Recipe Analyzer'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Неверный формат ответа от API');
        }

        const content = data.choices[0].message.content.trim();
        
        // Извлечение JSON из ответа (на случай, если есть дополнительные символы)
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Не удалось найти JSON в ответе');
        }

        const recipeData = JSON.parse(jsonMatch[0]);
        
        // Валидация данных
        if (!recipeData.dishName || !recipeData.instructions) {
            throw new Error('Неполные данные в ответе');
        }
        
        // Если нет nutritionPer100g, но есть nutrition, создаем nutritionPer100g
        if (!recipeData.nutritionPer100g && recipeData.nutrition) {
            const totalWeight = recipeData.totalWeight || 1000; // По умолчанию 1 кг
            recipeData.nutritionPer100g = {
                calories: Math.round((recipeData.nutrition.calories / totalWeight) * 100),
                proteins: Math.round((recipeData.nutrition.proteins / totalWeight) * 100 * 10) / 10,
                fats: Math.round((recipeData.nutrition.fats / totalWeight) * 100 * 10) / 10,
                carbs: Math.round((recipeData.nutrition.carbs / totalWeight) * 100 * 10) / 10
            };
        }
        
        // Если нет nutritionPerServing, но есть nutrition и servings
        if (!recipeData.nutritionPerServing && recipeData.nutrition && recipeData.servings) {
            recipeData.nutritionPerServing = {
                calories: Math.round(recipeData.nutrition.calories / recipeData.servings),
                proteins: Math.round((recipeData.nutrition.proteins / recipeData.servings) * 10) / 10,
                fats: Math.round((recipeData.nutrition.fats / recipeData.servings) * 10) / 10,
                carbs: Math.round((recipeData.nutrition.carbs / recipeData.servings) * 10) / 10
            };
        }
        
        // Если нет nutrition, но есть nutritionPer100g, создаем базовый nutrition
        if (!recipeData.nutrition && recipeData.nutritionPer100g) {
            const totalWeight = recipeData.totalWeight || 1000;
            recipeData.nutrition = {
                calories: Math.round((recipeData.nutritionPer100g.calories / 100) * totalWeight),
                proteins: Math.round((recipeData.nutritionPer100g.proteins / 100) * totalWeight * 10) / 10,
                fats: Math.round((recipeData.nutritionPer100g.fats / 100) * totalWeight * 10) / 10,
                carbs: Math.round((recipeData.nutritionPer100g.carbs / 100) * totalWeight * 10) / 10
            };
        }
        
        // Если нет тегов, создаем пустой массив
        if (!recipeData.tags || !Array.isArray(recipeData.tags)) {
            recipeData.tags = [];
        }

        return recipeData;

    } catch (error) {
        console.error('Ошибка при анализе рецепта:', error);
        
        if (error instanceof SyntaxError) {
            throw new Error('Ошибка парсинга ответа от нейросети. Попробуйте еще раз.');
        }
        
        if (error.message.includes('API Error')) {
            throw new Error(`Ошибка API: ${error.message}`);
        }
        
        throw new Error(`Не удалось проанализировать рецепт: ${error.message}`);
    }
}

/**
 * Генерация рецептов через ИИ агента Виту
 * @param {string} query - Запрос пользователя (предпочтения, время готовки, время приема пищи и т.д.)
 * @returns {Promise<Array>} - Массив из 2-3 рецептов
 */
export async function generateRecipes(query) {
    if (!query || query.trim().length === 0) {
        throw new Error('Запрос не может быть пустым');
    }

    const prompt = `Ты - Вита, персональный помощник по рецептам. Пользователь запросил рецепты с учетом следующих требований:
${query}

ВАЖНО: Верни ТОЧНО 2-3 рецепта блюд, которые соответствуют запросу пользователя.

Для КАЖДОГО рецепта предоставь полную информацию в следующем формате:

1. НАЗВАНИЕ БЛЮДА: Точное название блюда

2. ИНГРЕДИЕНТЫ: Все ингредиенты с точным указанием количества

3. РАСЧЕТ КБЖУ:
   - Рассчитай КБЖУ для каждого ингредиента с учетом количества и способа приготовления
   - Рассчитай общую массу готового блюда
   - Рассчитай КБЖУ на 100 грамм готового блюда
   - Рассчитай КБЖУ на одну порцию
   - Учитывай изменения при тепловой обработке

4. СЛОЖНОСТЬ: "Легко", "Средне" или "Сложно"

5. ВРЕМЯ ГОТОВКИ: В формате "X минут" или "X часов Y минут"

6. ПОШАГОВАЯ ИНСТРУКЦИЯ:
   - Разбей на много мелких шагов (минимум 8-12 для сложных блюд)
   - Пиши простым, понятным языком
   - Каждый шаг должен быть конкретным и выполнимым

7. ТЕГИ: 3-7 релевантных тегов (без символа #)

Верни ответ ТОЛЬКО в формате JSON без дополнительных комментариев:
{
  "recipes": [
    {
      "dishName": "Название блюда 1",
      "servings": число_порций,
      "totalWeight": общая_масса_в_граммах,
      "difficulty": "Легко" или "Средне" или "Сложно",
      "cookingTime": "X минут" или "X часов Y минут",
      "ingredients": [
        "ингредиент 1 с количеством",
        "ингредиент 2 с количеством"
      ],
      "nutritionPer100g": {
        "calories": число_ккал_на_100г,
        "proteins": число_г_белков_на_100г,
        "fats": число_г_жиров_на_100г,
        "carbs": число_г_углеводов_на_100г
      },
      "nutritionPerServing": {
        "calories": число_ккал_на_порцию,
        "proteins": число_г_белков_на_порцию,
        "fats": число_г_жиров_на_порцию,
        "carbs": число_г_углеводов_на_порцию
      },
      "nutrition": {
        "calories": общее_количество_ккал,
        "proteins": общее_количество_г_белков,
        "fats": общее_количество_г_жиров,
        "carbs": общее_количество_г_углеводов
      },
      "instructions": [
        {
          "step": 1,
          "title": "Краткое название этапа",
          "description": "Подробное описание этапа"
        }
      ],
      "tags": ["тег1", "тег2", "тег3"]
    },
    {
      "dishName": "Название блюда 2",
      ...
    },
    {
      "dishName": "Название блюда 3",
      ...
    }
  ]
}`;

    try {
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Vita Recipe Generator'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Неверный формат ответа от API');
        }

        const content = data.choices[0].message.content.trim();
        
        // Извлечение JSON из ответа
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Не удалось найти JSON в ответе');
        }

        const responseData = JSON.parse(jsonMatch[0]);
        
        // Валидация данных
        if (!responseData.recipes || !Array.isArray(responseData.recipes)) {
            throw new Error('Неверный формат ответа: отсутствует массив recipes');
        }

        // Обрабатываем каждый рецепт
        const recipes = responseData.recipes.map(recipe => {
            // Если нет nutritionPer100g, но есть nutrition, создаем nutritionPer100g
            if (!recipe.nutritionPer100g && recipe.nutrition) {
                const totalWeight = recipe.totalWeight || 1000;
                recipe.nutritionPer100g = {
                    calories: Math.round((recipe.nutrition.calories / totalWeight) * 100),
                    proteins: Math.round((recipe.nutrition.proteins / totalWeight) * 100 * 10) / 10,
                    fats: Math.round((recipe.nutrition.fats / totalWeight) * 100 * 10) / 10,
                    carbs: Math.round((recipe.nutrition.carbs / totalWeight) * 100 * 10) / 10
                };
            }
            
            // Если нет nutritionPerServing, но есть nutrition и servings
            if (!recipe.nutritionPerServing && recipe.nutrition && recipe.servings) {
                recipe.nutritionPerServing = {
                    calories: Math.round(recipe.nutrition.calories / recipe.servings),
                    proteins: Math.round((recipe.nutrition.proteins / recipe.servings) * 10) / 10,
                    fats: Math.round((recipe.nutrition.fats / recipe.servings) * 10) / 10,
                    carbs: Math.round((recipe.nutrition.carbs / recipe.servings) * 10) / 10
                };
            }
            
            // Если нет тегов, создаем пустой массив
            if (!recipe.tags || !Array.isArray(recipe.tags)) {
                recipe.tags = [];
            }

            return recipe;
        });

        return recipes;

    } catch (error) {
        console.error('Ошибка при генерации рецептов:', error);
        
        if (error instanceof SyntaxError) {
            throw new Error('Ошибка парсинга ответа от нейросети. Попробуйте еще раз.');
        }
        
        if (error.message.includes('API Error')) {
            throw new Error(`Ошибка API: ${error.message}`);
        }
        
        throw new Error(`Не удалось сгенерировать рецепты: ${error.message}`);
    }
}

/**
 * Установка API ключа (для настройки)
 */
export function setApiKey(apiKey) {
    if (typeof window !== 'undefined') {
        window.OPENROUTER_API_KEY = apiKey;
    }
}

/**
 * Получение текущего API ключа
 */
export function getApiKey() {
    return typeof window !== 'undefined' && window.OPENROUTER_API_KEY 
        ? window.OPENROUTER_API_KEY 
        : OPENROUTER_API_KEY;
}

