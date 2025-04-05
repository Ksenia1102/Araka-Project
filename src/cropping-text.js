// Директива: Перенос слов через пробел

const breakwords = {
    mounted(el, binding) {
        applyBreakWords(el, binding.value, binding.arg || 20);
    },
    updated(el, binding) {
        applyBreakWords(el, binding.value, binding.arg || 20);
    }
};

function applyBreakWords(el, text, maxLength) {
    if (!text || typeof text !== 'string') return;

    const breakLongWords = (text, maxLength) => {
        return text.replace(new RegExp(`(\\S{${maxLength}})(?=\\S)`, 'g'), '$1\u200B');
    };

    el.textContent = breakLongWords(text, maxLength);
}

// Директива: Обрезка текста с троеточием
const truncate = {
    mounted(el, binding) {
        const maxChars = binding.value || 100;
        const originalText = el.textContent.trim();

        if (originalText.length > maxChars) {
            el.setAttribute('title', originalText);
            const truncated = originalText.slice(0, maxChars) + '…';

            for (const node of el.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = truncated;
                    break;
                }
            }
        }
    }
};

// Директива: Ограничение ввода символов (для input)
const maxlength = {
    mounted(el, binding) {
        const max = binding.value || 100;
        el.setAttribute('maxlength', max);
    }
};

const lineLimit = {
    mounted(el, binding) {
        el.addEventListener('input', () => {
            const maxLength = binding.value || 30;
            const lines = el.value.split('\n');
            const limitedLines = lines.map((line) => line.slice(0, maxLength));
            const newValue = limitedLines.join('\n');

            if (el.value !== newValue) {
                el.value = newValue;
                el.dispatchEvent(new Event('input')); // обновить v-model
            }
        });
    }
};

// 📦 Экспорт всех директив
export default {
    install(app) {
        app.directive('breakwords', breakwords);
        app.directive('truncate', truncate);
        app.directive('maxlength', maxlength);
        app.directive('linelimit', lineLimit);
    }
};
