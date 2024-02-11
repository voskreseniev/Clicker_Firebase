// Инициализация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA6fMICLzu8pJ881pkHMuXTAQL6DY7i3sU",
    authDomain: "testproject-20e11.firebaseapp.com",
    databaseURL: "https://testproject-20e11-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "testproject-20e11",
    storageBucket: "testproject-20e11.appspot.com",
    messagingSenderId: "683647709233",
    appId: "1:683647709233:web:1d195c7891fbe1eed06510"
};

firebase.initializeApp(firebaseConfig);

// Ссылка на элементы страницы
const loginForm = document.getElementById('login-form');
const chatContainer = document.getElementById('chat-container');
const searchContainer = document.getElementById('search-container-wrapper'); // Получаем ссылку на контейнер для поиска

// Объявляем переменную для хранения текущего открытого профиля
let openedProfileUserId = null;

// Обработчик события submit для формы входа в систему
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Предотвращаем отправку формы
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Login successful!', userCredential.user);
            loadChat(); // Загружаем чат после успешной аутентификации
            // Показываем контейнер для поля поиска
            searchContainer.style.display = 'block';
        })
        .catch((error) => {
            console.error('Login failed!', error);
        });
});

// Функция для загрузки чата
function loadChat() {
    // Получаем ссылку на чат из базы данных
    const chatRef = firebase.database().ref('chat');

    // Очищаем контейнер чата перед загрузкой новых сообщений
    chatContainer.innerHTML = '';

    // Слушаем событие child_added для загрузки новых сообщений чата
    chatRef.on('child_added', (snapshot) => {
        renderMessage(snapshot); // Отображаем новое сообщение
    });

    // Слушаем событие child_removed для обновления чата после удаления сообщения
    chatRef.on('child_removed', (snapshot) => {
        const messageId = snapshot.key;
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.remove(); // Удаляем сообщение из DOM
        }
    });
}

// Функция для отображения сообщения
function renderMessage(snapshot) {
    const messageData = snapshot.val();
    const sender = messageData.sender || 'Anonymous';
    const text = messageData.message || '';
    const messageId = snapshot.key; // Получаем ID сообщения

    // Создаем элемент для отображения сообщения чата
    const messageElement = document.createElement('div');
    messageElement.id = messageId; // Устанавливаем ID элемента равным ID сообщения

    // Создаем элемент для отображения никнейма пользователя
    const senderElement = document.createElement('span');
    senderElement.textContent = sender;
    senderElement.classList.add('username'); // Добавляем класс для стилизации

    // Добавляем обработчик события клика к никнейму пользователя
    senderElement.addEventListener('click', () => {
        loadUserDataBySender(sender); // Передаем sender в функцию загрузки данных пользователя
    });

    // Добавляем никнейм пользователя и текст сообщения к элементу сообщения
    messageElement.appendChild(senderElement);
    messageElement.appendChild(document.createTextNode(`: ${text}`));

    // Создаем кнопку удаления сообщения
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', () => {
        deleteMessage(messageId); // Вызываем функцию для удаления сообщения
    });

    // Добавляем кнопку удаления к сообщению
    messageElement.appendChild(deleteButton);

    // Добавляем сообщение чата в контейнер чата на странице
    chatContainer.appendChild(messageElement);

    // Прокручиваем контейнер чата вниз
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Функция для удаления сообщения
function deleteMessage(messageId) {
    const chatRef = firebase.database().ref('chat');
    chatRef.child(messageId).remove()
        .then(() => {
            console.log('Сообщение успешно удалено');
        })
        .catch((error) => {
            console.error('Ошибка при удалении сообщения:', error);
        });
}

// Функция для открытия профиля пользователя
function toggleUserProfile(userData, userId) {
    const profileContainer = document.createElement('div');
    profileContainer.classList.add('profile-container');
    const { email, score } = userData;

    // Создаем элемент для отображения количества монет
    const scoreElement = document.createElement('span');
    scoreElement.textContent = `Score: ${score}`;
    scoreElement.classList.add('score');
    scoreElement.addEventListener('dblclick', () => {
        const newScore = prompt("Введите новое количество монет:");
        if (newScore !== null) {
            const userRef = firebase.database().ref('users/' + userId);
            userRef.update({ score: parseInt(newScore) }) // Преобразуем введенное значение в число
                .then(() => {
                    console.log('Количество монет успешно обновлено');
                    scoreElement.textContent = `Score: ${newScore}`; // Обновляем отображение на странице
                })
                .catch((error) => {
                    console.error('Ошибка при обновлении количества монет:', error);
                });
        }
    });

    // Добавляем элементы профиля пользователя в контейнер
    profileContainer.textContent = `Email: ${email}`;
    profileContainer.appendChild(scoreElement);

    const chatContainer = document.getElementById('chat-container');
    
    // Проверяем, открыт ли уже профиль этого пользователя
    if (openedProfileUserId === userId) {
        // Если профиль уже открыт, то закрываем его
        chatContainer.removeChild(document.getElementById('profile-' + userId));
        openedProfileUserId = null;
    } else {
        // Иначе, добавляем профиль пользователя в контейнер
        profileContainer.id = 'profile-' + userId;
        chatContainer.appendChild(profileContainer);
        openedProfileUserId = userId;
    }
}

// Функция для загрузки данных пользователя по его никнейму
function loadUserDataBySender(sender) {
    const userRef = firebase.database().ref('users').orderByChild('displayName').equalTo(sender);
    userRef.once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const userData = childSnapshot.val();
                    const userId = childSnapshot.key;
                    console.log("Загруженные данные пользователя:", userData);
                    toggleUserProfile(userData, userId); // Используем toggleUserProfile вместо openUserProfile
                });
            } else {
                console.log("Данные пользователя не найдены.");
            }
        })
        .catch((error) => {
            console.error("Ошибка при загрузке данных пользователя:", error);
        });
}

// Обработчик события для кнопки поиска
document.getElementById('search-button').addEventListener('click', () => {
    const searchInput = document.getElementById('search-input').value.trim(); // Получаем значение из поля ввода
    if (searchInput !== '') {
        searchUserByName(searchInput); // Запускаем функцию поиска пользователя по имени
    } else {
        console.log('Please enter a username to search.'); // Если поле ввода пустое, выводим сообщение об ошибке
    }
});

// Функция для поиска пользователя по имени
function searchUserByName(username) {
    const userRef = firebase.database().ref('users').orderByChild('displayName').equalTo(username);
    userRef.once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const userData = childSnapshot.val();
                    const userId = childSnapshot.key;
                    console.log("User found:", userData);
                    toggleUserProfile(userData, userId); // Открываем профиль найденного пользователя
                });
            } else {
                console.log("User not found.");
            }
        })
        .catch((error) => {
            console.error("Error searching for user:", error);
        });
}
