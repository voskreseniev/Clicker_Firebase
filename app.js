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

function login() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      loginContainer.style.display = 'none';
      gameContainer.style.display = 'block';
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
      userScore = 0;
      scoreDisplay.textContent = userScore;
      usernameDisplay.textContent = '';
      clearInterval(autoclickInterval);
    })
    .catch((error) => {
      alert(error.message);
    });
}

document.addEventListener('click', function() {
  incrementScore();
});

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
  input.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      const newDisplayName = input.value.trim();
      if (newDisplayName !== '') {
        setUserDisplayName(newDisplayName);
        usernameDisplay.textContent = newDisplayName;
        saveUserData();
      }
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
    console.log("Имя пользователя успешно изменено.");
  }).catch((error) => {
    console.error("Ошибка при изменении имени пользователя:", error);
  });
}

usernameDisplay.title = 'Двойной клик для изменения имени';
