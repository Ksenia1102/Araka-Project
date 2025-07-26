import axios from 'axios';

/**
 * Проверяет существование класса в базе данных и перенаправляет пользователя, если класс не найден.
 * @param {string} classId ID класса для проверки.
 * @param {object} router Объект маршрутизатора Vue Router.
 * @param {object} toast Объект PrimeVue Toast для уведомлений.
 * @param {string} apiUrl Базовый URL API.
 * @param {object} loading Объект для управления состоянием загрузки (опционально).
 */
export async function checkClassExistence(classId, router, toast, apiUrl, loading = null) {
    if (!classId) {
        // Если classId отсутствует, значит, мы не на странице конкретного класса,
        // или класс еще не выбран/создан. В этом случае проверка не требуется.
        return;
    }

    try {
        loading?.show('Проверка класса...'); // Показываем индикатор загрузки, если объект loading передан
        const token = localStorage.getItem('authToken');
        const url = `${apiUrl}/api/classes/${classId}`;

        // Отправляем GET-запрос для получения информации о классе.
        // Если класс не существует, сервер должен вернуть 404.
        await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // Если запрос успешен, класс существует.
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Класс не найден, перенаправляем пользователя
            toast.add({
                severity: 'warn',
                summary: 'Внимание',
                detail: 'Открытый класс не найден. Вы будете перенаправлены на страницу библиотеки.',
                life: 5000
            });
            router.push('/pages/dashboard'); // Перенаправляем на страницу библиотеки
        } else if (error.response && error.response.status === 401) {
            // Ошибка авторизации, перенаправляем на страницу входа
            toast.add({
                severity: 'error',
                summary: 'Ошибка авторизации',
                detail: 'Ваша сессия истекла. Пожалуйста, войдите снова.',
                life: 5000
            });
            router.push('/login');
        } else {
            // Обработка других возможных ошибок
            toast.add({
                severity: 'error',
                summary: 'Ошибка',
                detail: error.response?.data?.error || 'Не удалось проверить существование класса.',
                life: 5000
            });
            console.error('Ошибка при проверке существования класса:', error);
        }
    } finally {
        loading?.hide(); // Скрываем индикатор загрузки
    }
}
