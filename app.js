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

// Ссылки на элементы страницы
const gameContainer = document.getElementById('game-container');
const loginContainer = document.getElementById('login-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const scoreDisplay = document.getElementById('score');
const usernameDisplay = document.getElementById('username');
const toggleShopButton = document.getElementById('toggle-shop-button');
const shopContainer = document.getElementById('shop-container');
const logoutButton = document.getElementById('logout-button');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const leaderboardContainer = document.getElementById('leaderboard-container');
const leaderboardList = document.getElementById('leaderboard-list');

let userScore = 0;
let autoclickInterval;
let upgrade1Purchased = false;
let logoutCalled = false; // Флаг для проверки, был ли уже вызван выход
let shopOpen = false;
const upgrades = [
  { name: "Улучшение 1", cost: 100, autoclickMultiplier: 2 },
  { name: "Улучшение 2", cost: 200, autoclickMultiplier: 3 }
];

// Установить изначально стиль блока авторизации на display: none;
loginContainer.style.display = 'none';

// Отслеживаем изменения состояния аутентификации пользователя
firebase.auth().onAuthStateChanged(function(user) {
  if (!user) {
    // Если пользователь не аутентифицирован, показываем блок авторизации
    loginContainer.style.display = 'block';
    gameContainer.style.display = 'none';
  } else {
    // Если пользователь аутентифицирован, скрываем блок авторизации и отображаем блок игры
    loginContainer.style.display = 'none';
    gameContainer.style.display = 'block';
  }
});

// Проверяем наличие сохраненной информации о пользователе в локальном хранилище
const savedUser = localStorage.getItem('user');
if (savedUser) {
  const user = JSON.parse(savedUser);
  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(handleLoginSuccess)
    .catch(showAlert);
}

function handleLoginSuccess() {
  loginContainer.style.display = 'none';
  gameContainer.style.display = 'block';
  loadUserData();
}

function showAlert(message) {
  alert(message);
}

function login() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      handleLoginSuccess();
      saveUser(email, password);
      clearError(); // Очистка сообщения об ошибке при успешном входе
    })
    .catch((error) => {
      showError("Неправильный email или пароль. Пожалуйста, попробуйте снова.");
      console.error(error); // Логирование ошибки в консоль для отладки
    });
}

function signup() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // Устанавливаем параметр admin в базе данных только если пользователь не существует
      firebase.database().ref('users/' + user.uid).once('value')
        .then((snapshot) => {
          if (!snapshot.exists()) {
            firebase.database().ref('users/' + user.uid).set({
              email: user.email,
              admin: false // Устанавливаем admin в false при регистрации
            });
          }
        })
        .catch((error) => {
          console.error("Ошибка при проверке существования пользователя:", error);
        });
      handleLoginSuccess();
      saveUser(email, password);
      suggestUsername();
      upgrade1Purchased = false;
    })
    .catch(showAlert);
}

function logout() {
  // Удаляем обработчик события клика на кнопке "выход"
  logoutButton.removeEventListener('click', logout);

  const confirmLogout = confirm("Вы уверены, что хотите выйти?");
  if (confirmLogout) {
    firebase.auth().signOut()
      .then(() => {
        loginContainer.style.display = 'block';
        gameContainer.style.display = 'none';
        localStorage.removeItem('user');
        userScore = 0;
        scoreDisplay.textContent = userScore;
        usernameDisplay.textContent = '';
        clearInterval(autoclickInterval);
      })
      .catch(showAlert);
  }
}

document.addEventListener('click', function() {
  if (firebase.auth().currentUser) {
    incrementScore();
  }
});

function incrementScore() {
  userScore++;
  scoreDisplay.textContent = userScore;
  if (firebase.auth().currentUser) {
    saveScore(userScore);
  }
}

function loadUserData() {
  const userId = firebase.auth().currentUser.uid;
  const userRef = firebase.database().ref('users/' + userId);
  userRef.once('value')
    .then((snapshot) => {
      const userData = snapshot.val();
      console.log("Загруженные данные пользователя:", userData); // Добавляем логирование
      if (userData !== null) {
        userScore = userData.score || 0;
        scoreDisplay.textContent = userScore;
        upgrade1Purchased = userData.upgrade1Purchased || false; // Загрузка информации из базы данных
        if (upgrade1Purchased) {
          startAutoclick();
          const upgradeButton = document.getElementById('upgrade1-item');
          upgradeButton.disabled = true;
          upgradeButton.textContent = 'Автокликер куплен успешно';
        } else {
          stopAutoclick(); // Добавляем эту строку, чтобы убедиться, что автокликер не активен, если улучшение 1 не приобретено
        }
        const displayName = userData.displayName;
        if (displayName) {
          usernameDisplay.textContent = displayName;
        } else {
          // Не вызываем suggestUsername() здесь
        }
      }
    })
    .catch(showAlert);
}

function saveScore(score) {
  const user = firebase.auth().currentUser;
  if (user) {
    const userId = user.uid;
    firebase.database().ref('users/' + userId).update({
      score: score,
      upgrade1Purchased: upgrade1Purchased
    });
  } else {
    // Обработка случая, когда текущий пользователь не определен
    console.error('Ошибка: текущий пользователь не определен');
  }
}

function suggestUsername() {
  const defaultUsername = "User"; // Значение по умолчанию
  let displayName = prompt("Пожалуйста, введите ваше имя:", defaultUsername);
  if (!displayName || displayName.trim() === "") {
    // Если пользователь не ввел имя или ввел пустую строку, устанавливаем значение по умолчанию
    displayName = defaultUsername;
  }
  setUserDisplayName(displayName);
  usernameDisplay.textContent = displayName;
}

function buyUpgrade(upgradeIndex) {
  const upgrade = upgrades[upgradeIndex - 1];
  if (!upgrade1Purchased && upgradeIndex === 1) {
    if (userScore >= upgrade.cost) {
      userScore -= upgrade.cost;
      scoreDisplay.textContent = userScore;
      upgrade1Purchased = true;
      console.log("Улучшение 1 приобретено:", upgrade1Purchased); // Добавляем логирование
      startAutoclick();
      updateUpgradeCost(upgradeIndex);
      saveScore(userScore);
    } else {
      showAlert("Недостаточно монет для покупки улучшения!");
    }
  } else {
    showAlert("Вы уже приобрели это улучшение или выбрали неверный пункт в магазине.");
  }
}

function updateUpgradeCost(upgradeIndex) {
  const upgrade = upgrades[upgradeIndex - 1];
  const upgradeElement = document.getElementById(`upgrade${upgradeIndex}-cost`);
  upgradeElement.textContent = upgrade.cost;
}

function startAutoclick() {
  autoclickInterval = setInterval(incrementScore, 1000);
}

function stopAutoclick() {
  clearInterval(autoclickInterval);
}

function openUsernameEdit() {
  const currentDisplayName = usernameDisplay.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentDisplayName;
  input.classList.add('editable-input');
  input.addEventListener('blur', function() {
    const newDisplayName = input.value.trim();
    if (newDisplayName !== '') {
      setUserDisplayName(newDisplayName); // Вызываем функцию для обновления имени пользователя
      usernameDisplay.textContent = newDisplayName;
      input.disabled = true;
    }
  });
  usernameDisplay.innerHTML = '';
  usernameDisplay.appendChild(input);
  input.focus();
}

function setUserDisplayName(displayName) {
  const user = firebase.auth().currentUser;
  if (user) {
    user.updateProfile({
      displayName: displayName
    }).then(() => {
      console.log("Имя пользователя успешно изменено:", displayName);
      // Если изменение имени успешно, обновляем его также в базе данных
      updateUserDisplayNameInDatabase(displayName);
    }).catch((error) => {
      console.error("Ошибка при изменении имени пользователя:", error);
    });
  } else {
    console.error('Ошибка: текущий пользователь не определен');
  }
}

function updateUserDisplayNameInDatabase(displayName) {
  const user = firebase.auth().currentUser;
  if (user) {
    const userId = user.uid;
    firebase.database().ref('users/' + userId).update({
      displayName: displayName
    }).then(() => {
      console.log("Имя пользователя успешно обновлено в базе данных:", displayName);
    }).catch((error) => {
      console.error("Ошибка при обновлении имени пользователя в базе данных:", error);
    });
  } else {
    console.error('Ошибка: текущий пользователь не определен');
  }
}


function saveUser(email, password) {
  localStorage.setItem('user', JSON.stringify({ email, password }));
}

usernameDisplay.title = 'Двойной клик для изменения имени';

function resetPassword() {
  const email = emailInput.value;
  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      showAlert("На вашу почту отправлена ссылка для смены пароля.");
    })
    .catch(showAlert);
}

function changePassword() {
  const user = firebase.auth().currentUser;
  const newPassword = prompt("Пожалуйста, введите новый пароль:");
  user.updatePassword(newPassword)
    .then(() => {
      showAlert("Пароль успешно изменен.");
    })
    .catch(showAlert);
}

toggleShopButton.addEventListener('click', function() {
  if (!shopOpen) {
    shopContainer.style.display = 'block';
    toggleShopButton.textContent = 'Закрыть магазин';
    shopOpen = true;
  } else {
    shopContainer.style.display = 'none';
    toggleShopButton.textContent = 'Открыть магазин';
    shopOpen = false;
  }
});

logoutButton.style.backgroundColor = 'red';
const errorMessage = document.getElementById('error-message');

function showError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = '';
}

// Добавляем обработчик события dblclick к элементу usernameDisplay
usernameDisplay.addEventListener('dblclick', openUsernameEdit);

// Функция для отправки сообщений в чат
function sendMessage() {
  const messageInput = document.getElementById('chat-input');
  const message = messageInput.value.trim();
  const user = firebase.auth().currentUser;
  const senderName = user.displayName || 'Anonymous'; // Используем displayName пользователя или 'Anonymous', если нет имени
  if (message !== '') {
    const chatRef = firebase.database().ref('chat');
    chatRef.push({
      sender: senderName, // Сохраняем имя отправителя
      message: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    messageInput.value = ''; // Очистка поля ввода после отправки сообщения
  }
}


// Функция для обновления лидерборда
function updateLeaderboardRealtime() {
  const leaderboardList = document.getElementById('leaderboard-list');
  const usersRef = firebase.database().ref('users');
  
  // Добавляем слушатель изменений в базе данных Firebase
  usersRef.orderByChild('score').limitToLast(10).on('value', function(snapshot) {
    leaderboardList.innerHTML = ''; // Очищаем список перед обновлением
    const leaderboardData = [];
    snapshot.forEach(function(childSnapshot) {
      leaderboardData.push(childSnapshot.val());
    });
    leaderboardData.reverse(); // Разворачиваем массив, чтобы отобразить лидеров с наивысшими баллами в начале
    leaderboardData.forEach(function(user, index) {
      const listItem = document.createElement('li');
      listItem.textContent = `${index + 1}. ${user.displayName || 'Anonymous'}: ${user.score}`;
      leaderboardList.appendChild(listItem);
    });
  });
}

// Вызываем функцию для обновления лидерборда в реальном времени
updateLeaderboardRealtime();


// Вызов функций для отображения сообщений чата и обновления лидерборда
displayChatMessages();


function sendMessageToDatabase(messageText, senderName) {
  const messageRef = firebase.database().ref('chat').push(); // Создаем уникальный ключ для сообщения
  const timestamp = firebase.database.ServerValue.TIMESTAMP; // Получаем текущую временную метку
  
  const messageData = {
    text: messageText,
    sender: senderName,
    timestamp: timestamp
  };

  messageRef.set(messageData)
    .then(() => {
      console.log('Сообщение успешно отправлено в базу данных');
    })
    .catch((error) => {
      console.error('Ошибка при отправке сообщения:', error);
    });
}

// Функция для отображения сообщений чата
function displayChatMessages() {
  const chatRef = firebase.database().ref('chat');
  chatRef.on('child_added', function(snapshot) {
    const messageData = snapshot.val();
    const sender = messageData.sender || 'Anonymous';
    const text = messageData.message || '';
    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${text}`;
    chatMessages.appendChild(messageElement);
    // Прокрутка вниз при добавлении нового сообщения для просмотра последних сообщений
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}
