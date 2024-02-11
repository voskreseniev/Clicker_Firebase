// Инициализация Firebase
const firebaseConfig = {apiKey:"AIzaSyA6fMICLzu8pJ881pkHMuXTAQL6DY7i3sU",authDomain:"testproject-20e11.firebaseapp.com",databaseURL:"https://testproject-20e11-default-rtdb.europe-west1.firebasedatabase.app",projectId:"testproject-20e11",storageBucket:"testproject-20e11.appspot.com",messagingSenderId:"683647709233",appId:"1:683647709233:web:1d195c7891fbe1eed06510"};firebase.initializeApp(firebaseConfig);

  firebase.initializeApp(firebaseConfig);
  
  // Ссылки на элементы страницы
  const loginContainer = document.getElementById('login-container');
  const adminFunctionsContainer = document.getElementById('admin-functions');
  const adminChatContainer = document.getElementById('admin-chat');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const adminEmailInput = document.getElementById('admin-email');
  const adminPasswordInput = document.getElementById('admin-password');
  
  let isAdminLoggedIn = false;
  
  // Обработка входа администратора
  function adminLogin() {
    const email = adminEmailInput.value;
    const password = adminPasswordInput.value;
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(() => {
        isAdminLoggedIn = true;
        loginContainer.style.display = 'none';
        adminFunctionsContainer.style.display = 'block';
        adminChatContainer.style.display = 'block';
        displayChatMessages();
      })
      .catch(error => {
        console.error(error.message);
        alert("Ошибка входа. Пожалуйста, проверьте введенные данные.");
      });
  }
  
  // Обработка выхода администратора
  function adminLogout() {
    firebase.auth().signOut()
      .then(() => {
        isAdminLoggedIn = false;
        loginContainer.style.display = 'block';
        adminFunctionsContainer.style.display = 'none';
        adminChatContainer.style.display = 'none';
        clearChatMessages();
      })
      .catch(error => {
        console.error(error.message);
        alert("Ошибка выхода. Пожалуйста, повторите попытку.");
      });
  }
  
  // Отправка сообщения в чат
  function sendMessage() {
    const message = chatInput.value.trim();
    if (message !== '') {
      const user = firebase.auth().currentUser;
      const senderName = user.displayName || 'Admin';
      const chatRef = firebase.database().ref('chat');
      chatRef.push({
        sender: senderName,
        message: message,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      chatInput.value = '';
    }
  }
  
  // Отображение сообщений чата
  function displayChatMessages() {
    const chatRef = firebase.database().ref('chat');
    chatRef.on('child_added', snapshot => {
      const messageData = snapshot.val();
      const sender = messageData.sender || 'Anonymous';
      const text = messageData.message || '';
      const messageElement = document.createElement('div');
      messageElement.textContent = `${sender}: ${text}`;
      chatMessages.appendChild(messageElement);
    });
  }
  
  // Очистка сообщений чата
  function clearChatMessages() {
    chatMessages.innerHTML = '';
  }
  