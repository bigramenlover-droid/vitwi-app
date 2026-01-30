// Работа с Telegram Web App API

let tg = window.Telegram.WebApp;

// Инициализация Telegram Web App
tg.ready();
tg.expand();

// Получение данных пользователя
export function getUserData() {
    return tg.initDataUnsafe?.user || null;
}

// Получение пересланного сообщения
export function getForwardedMessage() {
    // Telegram Web App может получить данные из initData
    // Для пересланных сообщений нужно использовать специальные параметры
    const initData = tg.initDataUnsafe;
    
    if (initData?.start_param) {
        // Если есть start_param, это может быть ID сообщения
        return initData.start_param;
    }
    
    // Альтернативный способ - через query_id и текст сообщения
    if (initData?.query_id) {
        return {
            queryId: initData.query_id,
            text: initData.text || ''
        };
    }
    
    return null;
}

// Получение текста из пересланного сообщения
export function getMessageText() {
    console.log('🔍 Поиск текста рецепта...');
    console.log('📍 Полный URL:', window.location.href);
    console.log('📍 Search params:', window.location.search);
    console.log('📍 Hash:', window.location.hash);
    
    // Сначала проверяем URL параметры (самый надежный способ для web_app кнопок)
    if (window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('start');
        if (startParam) {
            try {
                const decoded = decodeURIComponent(startParam);
                console.log('✅ Текст получен из URL параметра start, длина:', decoded.length, 'символов');
                return decoded;
            } catch (e) {
                console.error('❌ Ошибка декодирования URL параметра:', e);
                return startParam;
            }
        }
    }
    
    // Проверяем hash параметры (на случай, если параметры в hash)
    if (window.location.hash && window.location.hash.length > 1) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashStart = hashParams.get('start');
        if (hashStart) {
            try {
                const decoded = decodeURIComponent(hashStart);
                console.log('✅ Текст получен из hash параметра start, длина:', decoded.length, 'символов');
                return decoded;
            } catch (e) {
                console.error('❌ Ошибка декодирования hash параметра:', e);
                return hashStart;
            }
        }
    }
    
    const initData = tg.initDataUnsafe;
    console.log('📦 initData:', initData);
    
    // Попытка получить текст из initData
    if (initData?.text) {
        console.log('✅ Текст получен из initData.text, длина:', initData.text.length, 'символов');
        return initData.text;
    }
    
    // Если приложение открыто через inline-кнопку с пересылкой
    if (initData?.start_param) {
        try {
            // start_param содержит закодированный текст рецепта
            const decoded = decodeURIComponent(initData.start_param);
            console.log('✅ Текст получен из initData.start_param, длина:', decoded.length, 'символов');
            return decoded;
        } catch (e) {
            console.error('❌ Ошибка декодирования start_param:', e);
            return initData.start_param; // Возвращаем как есть, если декодирование не удалось
        }
    }
    
    console.log('❌ Текст не найден ни в одном источнике');
    console.log('💡 Проверьте, что бот передает параметр ?start= в URL');
    return null;
}

// Показ главной кнопки
export function showMainButton(text, callback) {
    tg.MainButton.setText(text);
    tg.MainButton.onClick(callback);
    tg.MainButton.show();
}

// Скрытие главной кнопки
export function hideMainButton() {
    tg.MainButton.hide();
}

// Показ всплывающего окна
export function showAlert(message) {
    tg.showAlert(message);
}

// Показ подтверждения
export function showConfirm(message, callback) {
    tg.showConfirm(message, callback);
}

// Закрытие приложения
export function closeApp() {
    tg.close();
}

// Вибрация
export function vibrate() {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}

// Получение темы
export function getTheme() {
    return {
        isDark: tg.colorScheme === 'dark',
        bgColor: tg.themeParams.bg_color || '#ffffff',
        textColor: tg.themeParams.text_color || '#000000',
        hintColor: tg.themeParams.hint_color || '#999999',
        buttonColor: tg.themeParams.button_color || '#2481cc',
        buttonTextColor: tg.themeParams.button_text_color || '#ffffff'
    };
}

// Применение темы Telegram
export function applyTheme() {
    const theme = getTheme();
    document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bgColor);
    document.documentElement.style.setProperty('--tg-theme-text-color', theme.textColor);
    document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hintColor);
    document.documentElement.style.setProperty('--tg-theme-button-color', theme.buttonColor);
    document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.buttonTextColor);
}

// Инициализация при загрузке
applyTheme();

// Обработка изменений темы
tg.onEvent('themeChanged', applyTheme);

// Экспорт объекта tg для прямого доступа
export { tg };

