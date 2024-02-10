// Инициализация Firebase
const firebaseConfig = {apiKey:"AIzaSyA6fMICLzu8pJ881pkHMuXTAQL6DY7i3sU",authDomain:"testproject-20e11.firebaseapp.com",databaseURL:"https://testproject-20e11-default-rtdb.europe-west1.firebasedatabase.app",projectId:"testproject-20e11",storageBucket:"testproject-20e11.appspot.com",messagingSenderId:"683647709233",appId:"1:683647709233:web:1d195c7891fbe1eed06510"};firebase.initializeApp(firebaseConfig);

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
const upgrades = [{name:"Улучшение 1",cost:100,autoclickMultiplier:2},{name:"Улучшение 2",cost:200,autoclickMultiplier:3}];

function login() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {loginContainer.style.display = 'none';gameContainer.style.display = 'block';usernameDisplay.textContent = firebase.auth().currentUser.displayName || 'Анонимный пользователь';loadUserData();})
    .catch((error) => {alert(error.message);});
}

function signup() {
  const email = emailInput.value;
  const password = passwordInput.value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {loginContainer.style.display = 'none';gameContainer.style.display = 'block';const displayName = email.split('@')[0];setUserDisplayName(displayName);usernameDisplay.textContent = displayName;loadUserData();})
    .catch((error) => {alert(error.message);});
}

function logout() {
  firebase.auth().signOut()
    .then(() => {loginContainer.style.display = 'block';gameContainer.style.display = 'none';userScore = 0;scoreDisplay.textContent = userScore;usernameDisplay.textContent = '';clearInterval(autoclickInterval);})
    .catch((error) => {alert(error.message);});
}

document.addEventListener('click', function() {incrementScore();});

function incrementScore() {
  userScore++;
  scoreDisplay.textContent = userScore;
  saveScore(userScore);
}

function loadUserData() {
  const userId = firebase.auth().currentUser.uid;
  const userRef = firebase.database().ref('users/' + userId);
  userRef.once('value')
    .then((snapshot) => {const userData = snapshot.val();if (userData !== null) {userScore = userData.score || 0;scoreDisplay.textContent = userScore;upgrade1Purchased = userData.upgrade1Purchased || false;if (upgrade1Purchased) {startAutoclick();}}})
    .catch((error) => {console.error(error);});
}

function saveScore(score) {
  const userId = firebase.auth().currentUser.uid;
  firebase.database().ref('users/' + userId).set({displayName: firebase.auth().currentUser.displayName,score: score,upgrade1Purchased: upgrade1Purchased});
}

function buyUpgrade(upgradeIndex) {
  const upgrade = upgrades[upgradeIndex - 1];
  if (!upgrade1Purchased && upgradeIndex === 1) {
    if (userScore >= upgrade.cost) {userScore -= upgrade.cost;scoreDisplay.textContent = userScore;upgrade1Purchased = true;startAutoclick();updateUpgradeCost(upgradeIndex);saveUserData();}
    else {alert("Недостаточно монет для покупки улучшения!");}
  } else {alert("Вы уже приобрели это улучшение или выбрали неверный пункт в магазине.");}
}

function updateUpgradeCost(upgradeIndex) {
  const upgrade = upgrades[upgradeIndex - 1];
  const upgradeElement = document.getElementById(`upgrade${upgradeIndex}-cost`);
  upgradeElement.textContent = upgrade.cost;
}

function startAutoclick() {
  autoclickInterval = setInterval(function() {incrementScore();}, 1000);
}

let clickCount = 0;
let timer;

usernameDisplay.addEventListener('click', function() {
  clickCount++;
  if (clickCount === 1) {
    timer = setTimeout(function() {clickCount = 0;}, 300);
  } else if (clickCount === 2) {
    clearTimeout(timer);
    clickCount = 0;
    openUsernameEdit();
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
      }
    }
  });
  usernameDisplay.innerHTML = '';
  usernameDisplay.appendChild(input);
  input.focus();
}

usernameDisplay.title = 'Нажмите 2 раза для изменения';

document.addEventListener('selectstart', function(e) {e.preventDefault();});
