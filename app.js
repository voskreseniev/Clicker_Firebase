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
const toggleShopButton = document.getElementById('toggle-shop-button');
const shopContainer = document.getElementById('shop-container');
const logoutButton = document.getElementById('logout-button');
let userScore = 0;
let autoclickInterval;
let upgrade1Purchased = false;
let logoutCalled = false; // Флаг для проверки, был ли уже вызван выход
const upgrades = [
  { name: "Улучшение 1", cost: 100, autoclickMultiplier: 2 },
  { name: "Улучшение 2", cost: 200, autoclickMultiplier: 3 }
];

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
    })
    .catch(showAlert);
}

function signup() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      handleLoginSuccess();
      saveUser(email, password);
      suggestUsername();
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
      if (userData !== null) {
        userScore = userData.score || 0;
        scoreDisplay.textContent = userScore;
        upgrade1Purchased = userData.upgrade1Purchased || false;
        if (upgrade1Purchased) {
          startAutoclick();
          const upgradeButton = document.getElementById('upgrade1-item');
          upgradeButton.disabled = true;
          upgradeButton.textContent = 'Автокликер куплен успешно';
        }
        const displayName = userData.displayName;
        if (displayName) {
          usernameDisplay.textContent = displayName;
        } else {
          suggestUsername();
        }
      }
    })
    .catch(showAlert);
}

function saveScore(score) {
  const user = firebase.auth().currentUser;
  if (user) {
    const userId = user.uid;
    firebase.database().ref('users/' + userId).set({
      displayName: user.displayName,
      score: score,
      upgrade1Purchased: upgrade1Purchased
    });
  } else {
    // Обработка случая, когда текущий пользователь не определен
    console.error('Ошибка: текущий пользователь не определен');
  }
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
      input.disabled = true;
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