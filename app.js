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

// Проверяем, поддерживает ли браузер историю переходов
if (window.history && window.history.pushState) {
  // Очищаем адресную строку
  window.history.pushState('', document.title, window.location.pathname);
}

// Ссылки на элементы страницы
const loginContainer = document.getElementById('login-container');
const gameContainer = document.getElementById('game-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const scoreDisplay = document.getElementById('score');
const usernameDisplay = document.getElementById('username');

let userScore = 0;

// Обработчик нажатия кнопки входа
function login() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
          // Успешный вход, отобразить игровой контейнер и имя пользователя
          loginContainer.style.display = 'none';
          gameContainer.style.display = 'block';
          usernameDisplay.textContent = firebase.auth().currentUser.displayName || 'Анонимный пользователь';
          // Загрузить счет из базы данных
          loadScore();
      })
      .catch((error) => {
          alert(error.message);
      });
}

// Обработчик нажатия кнопки регистрации
function signup() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
          // Успешная регистрация, отобразить игровой контейнер и установить имя пользователя
          loginContainer.style.display = 'none';
          gameContainer.style.display = 'block';
          const displayName = email.split('@')[0]; // Имя пользователя по умолчанию из email
          setUserDisplayName(displayName);
          usernameDisplay.textContent = displayName;
          // Загрузить счет из базы данных
          loadScore();
      })
      .catch((error) => {
          alert(error.message);
      });
}

// Обработчик нажатия кнопки выхода
function logout() {
  firebase.auth().signOut()
      .then(() => {
          // Выход выполнен успешно, вернуться к контейнеру входа и очистить счет
          loginContainer.style.display = 'block';
          gameContainer.style.display = 'none';
          userScore = 0;
          scoreDisplay.textContent = userScore;
          usernameDisplay.textContent = '';
      })
      .catch((error) => {
          alert(error.message);
      });
}

// Обработчик увеличения счета при клике в любом месте страницы
document.addEventListener('click', function() {
  incrementScore();
});

// Функция увеличения счета
function incrementScore() {
  userScore++;
  scoreDisplay.textContent = userScore;
  // Сохранить счет в базе данных
  saveScore(userScore);
}

// Функция загрузки счета из базы данных
function loadScore() {
  const userId = firebase.auth().currentUser.uid;
  const scoreRef = firebase.database().ref('users/' + userId + '/score');
  scoreRef.once('value')
      .then((snapshot) => {
          const score = snapshot.val();
          if (score !== null) {
              userScore = score;
              scoreDisplay.textContent = userScore;
          }
      })
      .catch((error) => {
          console.error(error);
      });
}

// Функция сохранения счета в базе данных
function saveScore(score) {
  const userId = firebase.auth().currentUser.uid;
  firebase.database().ref('users/' + userId).set({
      displayName: firebase.auth().currentUser.displayName,
      score: score
  });
}

// Функция установки имени пользователя
function setUserDisplayName(displayName) {
  firebase.auth().currentUser.updateProfile({
      displayName: displayName
  });
}

// Обработчик двойного клика на имя пользователя для изменения
let clickCount = 0;
let timer;

usernameDisplay.addEventListener('click', function() {
  clickCount++;
  if (clickCount === 1) {
      timer = setTimeout(function() {
          clickCount = 0;
      }, 300);
  } else if (clickCount === 2) {
      clearTimeout(timer);
      clickCount = 0;
      openUsernameEdit();
  }
});

// Функция открытия редактирования имени пользователя
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
          }
      }
  });
  usernameDisplay.innerHTML = '';
  usernameDisplay.appendChild(input);
  input.focus();
}

// Добавление подсказки при наведении на имя пользователя
usernameDisplay.title = 'Нажмите 2 раза для изменения';


// Отключение выделения текста
document.addEventListener('selectstart', function(e) {
  e.preventDefault();
});
