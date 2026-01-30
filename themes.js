// Система тем для Vitwi Mini App

export const themes = {
    light: {
        name: 'Светлая',
        icon: '☀️',
        colors: {
            '--theme-bg': '#ffffff',
            '--theme-bg-secondary': '#f8f9fa',
            '--theme-text': '#1a1a1a',
            '--theme-text-secondary': '#6c757d',
            '--theme-primary': '#2481cc',
            '--theme-primary-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '--theme-success': '#4caf50',
            '--theme-success-gradient': 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            '--theme-error': '#f44336',
            '--theme-warning': '#ff9800',
            '--theme-border': 'rgba(0, 0, 0, 0.1)',
            '--theme-shadow': 'rgba(0, 0, 0, 0.1)',
        }
    },
    dark: {
        name: 'Темная',
        icon: '🌙',
        colors: {
            '--theme-bg': '#1a1a1a',
            '--theme-bg-secondary': '#2d2d2d',
            '--theme-text': '#ffffff',
            '--theme-text-secondary': '#b0b0b0',
            '--theme-primary': '#4a9eff',
            '--theme-primary-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '--theme-success': '#66bb6a',
            '--theme-success-gradient': 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)',
            '--theme-error': '#ef5350',
            '--theme-warning': '#ffa726',
            '--theme-border': 'rgba(255, 255, 255, 0.1)',
            '--theme-shadow': 'rgba(0, 0, 0, 0.5)',
        }
    }
};

// Получение сохраненной темы
export function getSavedTheme() {
    try {
        const saved = localStorage.getItem('vitwi-theme');
        // Если сохранена системная тема или тема не найдена, возвращаем светлую
        if (!saved || !themes[saved] || saved === 'system') {
            return 'light';
        }
        return saved;
    } catch (error) {
        console.error('Ошибка загрузки темы:', error);
        return 'light';
    }
}

// Сохранение темы
export function saveTheme(themeName) {
    try {
        localStorage.setItem('vitwi-theme', themeName);
    } catch (error) {
        console.error('Ошибка сохранения темы:', error);
    }
}

// Применение темы
export function applyTheme(themeName) {
    if (!themes[themeName]) {
        console.warn(`Тема "${themeName}" не найдена`);
        return;
    }

    const theme = themes[themeName];
    const root = document.documentElement;

    // Применяем цвета темы
    Object.entries(theme.colors).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });

    // Сохраняем выбранную тему
    saveTheme(themeName);

    // Добавляем класс темы к body для дополнительной стилизации
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeName}`);

    return theme;
}

// Инициализация темы при загрузке
export function initTheme() {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    return savedTheme;
}

// Получение списка всех тем
export function getThemesList() {
    return Object.keys(themes).map(key => ({
        key,
        ...themes[key]
    }));
}

