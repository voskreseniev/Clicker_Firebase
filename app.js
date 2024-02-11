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
const loginContainer = document.getElementById('login-container');
const gameContainer = document.getElementById('game-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const scoreDisplay = document.getElementById('score');
const usernameDisplay = document.getElementById('username');
let userScore = 0;
let autoclickInterval;
let upgrade1Purchased = false;
const upgrades = [
  { name: "Улучшение 1", cost: 100, autoclickMultiplier: 2 },
  { name: "Улучшение 2", cost: 200, autoclickMultiplier: 3 }
];

// Проверяем наличие сохраненной информации о пользователе в локальном хранилище
const savedUser = localStorage.getItem('user');
if (savedUser) {
  const user = JSON.parse(savedUser);
  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then((userCredential) => {
      loginContainer.style.display = 'none';
      gameContainer.style.display = 'block';
      loadUserData(); // Загрузка данных пользователя после успешного входа
    })
    .catch((error) => {
      alert(error.message);
    });
}

function login() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      loginContainer.style.display = 'none';
      gameContainer.style.display = 'block';
      saveUser(email, password); // Сохраняем информацию о пользователе в локальное хранилище при успешном входе
      loadUserData(); // Загрузка данных пользователя после успешного входа
    })
    .catch((error) => {
      alert(error.message);
    });
}

function signup() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      loginContainer.style.display = 'none';
      gameContainer.style.display = 'block';
      saveUser(email, password); // Сохраняем информацию о пользователе в локальное хранилище при успешной регистрации
      suggestUsername(); // Предложение ввести имя пользователя после успешной регистрации
    })
    .catch((error) => {
      alert(error.message);
    });
}

function logout() {
  firebase.auth().signOut()
    .then(() => {
      loginContainer.style.display = 'block';
      gameContainer.style.display = 'none';
      localStorage.removeItem('user'); // Удаляем информацию о пользователе из локального хранилища при выходе
      userScore = 0;
      scoreDisplay.textContent = userScore;
      usernameDisplay.textContent = '';
      clearInterval(autoclickInterval);
    })
    .catch((error) => {
      alert(error.message);
    });
}

// Функция для обработки клика после проверки авторизации пользователя
function handleClick() {
  if (firebase.auth().currentUser) {
    incrementScore();
  }
}

// Заменяем обработчик события click на вызов функции handleClick
document.addEventListener('click', handleClick);

function incrementScore() {
  userScore++;
  scoreDisplay.textContent = userScore;
  saveScore(userScore);
}

function loadUserData() {
  const userId = firebase.auth().currentUser.uid;
  const userRef = firebase.database().ref('users/' + userId);
  userRef.once('value')
    .then((snapshot) => {
      const userData = snapshot.val();
      if (userData !== null) {
        userScore = userData.score || 0;
        scoreDisplay.textContent = userScore;
        upgrade1Purchased = userData.upgrade1Purchased || false;
        if (upgrade1Purchased) {
          startAutoclick();
          const upgradeButton = document.getElementById('upgrade1-item');
          upgradeButton.disabled = true;
          upgradeButton.textContent = 'Куплено';
        }
        const displayName = userData.displayName;
        if (displayName) {
          usernameDisplay.textContent = displayName; // Загружаем имя пользователя из базы данных
        } else {
          suggestUsername(); // Предлагаем ввести имя пользователя, если оно отсутствует
        }
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

function saveScore(score) {
  const userId = firebase.auth().currentUser.uid;
  firebase.database().ref('users/' + userId).set({
    displayName: firebase.auth().currentUser.displayName,
    score: score,
    upgrade1Purchased: upgrade1Purchased
  });
}

function suggestUsername() {
  const defaultUsername = "Анонимный пользователь";
  const displayName = prompt("Пожалуйста, введите ваше имя:", defaultUsername);
  if (displayName && displayName !== defaultUsername) {
    setUserDisplayName(displayName);
    usernameDisplay.textContent = displayName;
  }
}

function buyUpgrade(upgradeIndex) {
  const upgrade = upgrades[upgradeIndex - 1];
  if (!upgrade1Purchased && upgradeIndex === 1) {
    if (userScore >= upgrade.cost) {
      userScore -= upgrade.cost;
      scoreDisplay.textContent = userScore;
      upgrade1Purchased = true;
      startAutoclick();
      updateUpgradeCost(upgradeIndex);
      saveUserData();
    } else {
      alert("Недостаточно монет для покупки улучшения!");
    }
  } else {
    alert("Вы уже приобрели это улучшение или выбрали неверный пункт в магазине.");
  }
}

function updateUpgradeCost(upgradeIndex) {
  const upgrade = upgrades[upgradeIndex - 1];
  const upgradeElement = document.getElementById(`upgrade${upgradeIndex}-cost`);
  upgradeElement.textContent = upgrade.cost;
}

function startAutoclick() {
  autoclickInterval = setInterval(function() {
    incrementScore();
  }, 1000);
}

let lastClickTime = 0;

usernameDisplay.addEventListener('click', function() {
  const currentTime = new Date().getTime();
  if (currentTime - lastClickTime < 300) {
    openUsernameEdit();
  } else {
    lastClickTime = currentTime;
  }
});

function openUsernameEdit() {
  const currentDisplayName = usernameDisplay.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentDisplayName;
  input.classList.add('editable-input');
  input.addEventListener('blur', function() {
    const newDisplayName = input.value.trim();
    if (newDisplayName !== '') {
      setUserDisplayName(newDisplayName);
      usernameDisplay.textContent = newDisplayName;
      input.disabled = true; // Делаем поле ввода неактивным после сохранения имени
    }
  });
  usernameDisplay.innerHTML = '';
  usernameDisplay.appendChild(input);
  input.focus();
}

function setUserDisplayName(displayName) {
  firebase.auth().currentUser.updateProfile({
    displayName: displayName
  }).then(() => {
    console.log("Имя пользователя успешно изменено:", displayName);
  }).catch((error) => {
    console.error("Ошибка при изменении имени пользователя:", error);
  });
}

function saveUser(email, password) {
  localStorage.setItem('user', JSON.stringify({ email, password })); // Сохраняем информацию о пользователе в локальное хранилище
}

usernameDisplay.title = 'Двойной клик для изменения имени';
function suggestUsername() {
  const defaultUsername = "user"; // Стандартное имя для новых пользователей
  const displayName = prompt("Пожалуйста, введите ваше имя:", defaultUsername);
  if (displayName && displayName.trim() !== '') {
    setUserDisplayName(displayName);
    usernameDisplay.textContent = displayName;
  } else {
    setUserDisplayName(defaultUsername); // Если пользователь не ввел имя или ввел пустую строку, устанавливаем стандартное имя
    usernameDisplay.textContent = defaultUsername;
  }
}
function resetPassword() {
  const email = emailInput.value;
  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      alert("На вашу почту отправлена ссылка для смены пароля.");
    })
    .catch((error) => {
      alert(error.message);
    });
}

// Внутри функции signup() добавим кнопку смены пароля после успешной регистрации
function signup() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      loginContainer.style.display = 'none';
      gameContainer.style.display = 'block';
      saveUser(email, password); // Сохраняем информацию о пользователе в локальное хранилище при успешной регистрации
      suggestUsername(); // Предложение ввести имя пользователя после успешной регистрации
      addButtonChangePassword(); // Добавляем кнопку смены пароля
    })
    .catch((error) => {
      alert(error.message);
    });
}


// Функция смены пароля
function changePassword() {
  const user = firebase.auth().currentUser;
  const newPassword = prompt("Пожалуйста, введите новый пароль:");
  user.updatePassword(newPassword)
    .then(() => {
      alert("Пароль успешно изменен.");
    })
    .catch((error) => {
      alert(error.message);
    });
}
