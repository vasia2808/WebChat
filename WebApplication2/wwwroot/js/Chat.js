document.addEventListener('DOMContentLoaded', function() {
    const username = sessionStorage.getItem('username');
    if (!username) {
        window.location.href = '/';
        return;
    }

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/chatHub")
        .configureLogging(signalR.LogLevel.Information)
        .build();

    let currentRoom = null;
    const messageHistory = {}; // Об'єкт для зберігання історії повідомлень по кімнатах

    // DOM elements
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messagesList = document.getElementById('messagesList');
    const roomList = document.getElementById('roomList');
    const currentRoomDisplay = document.getElementById('currentRoom');

    // Функція для додавання повідомлення в історію
    function addMessageToHistory(room, user, message) {
        if (!messageHistory[room]) {
            messageHistory[room] = [];
        }
        messageHistory[room].push({ user, message });
    }

    // Функція для відображення історії повідомлень кімнати
    function displayRoomHistory(room) {
        messagesList.innerHTML = ''; // Очищаємо контейнер повідомлень
        
        if (messageHistory[room]) {
            messageHistory[room].forEach(msg => {
                displayMessage(msg.user, msg.message);
            });
        }
    }

    // Функція для відображення одного повідомлення
    function displayMessage(user, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        const userElement = document.createElement('span');
        userElement.classList.add('user');
        userElement.textContent = user === 'System' ? '' : `${user}: `;
        if (user === 'System') {
            userElement.classList.add('system');
        }
        
        const textElement = document.createElement('span');
        textElement.classList.add('text');
        textElement.textContent = message;
        
        messageElement.appendChild(userElement);
        messageElement.appendChild(textElement);
        messagesList.appendChild(messageElement);
        
        // Прокручуємо до низу
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    // Обробник кліку на кімнату
    roomList.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const roomName = this.getAttribute('data-room');
            
            if (currentRoom === roomName) return; // Вже в цій кімнаті
            
            if (currentRoom) {
                // Виходимо з поточної кімнати
                connection.invoke('LeaveRoom', currentRoom, username)
                    .catch(err => console.error(err));
            }
            
            // Приєднуємось до нової кімнати
            connection.invoke('JoinRoom', roomName, username)
                .then(() => {
                    currentRoom = roomName;
                    currentRoomDisplay.textContent = `Room: ${roomName}`;
                    messageInput.disabled = false;
                    sendButton.disabled = false;
                    messageInput.focus();
                    
                    // Оновлюємо активну кімнату в UI
                    roomList.querySelectorAll('.list-group-item').forEach(i => {
                        i.classList.remove('active');
                    });
                    this.classList.add('active');
                    
                    // Відображаємо історію нової кімнати
                    displayRoomHistory(roomName);
                })
                .catch(err => console.error(err));
        });
    });

    // Надсилання повідомлення
    sendButton.addEventListener('click', function() {
        const message = messageInput.value.trim();
        if (message && currentRoom) {
            connection.invoke('SendMessage', currentRoom, username, message)
                .then(() => messageInput.value = '')
                .catch(err => console.error(err));
        }
    });

    // Надсилання повідомлення по Enter
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    // Отримання повідомлень
    connection.on('ReceiveMessage', function(user, message) {
        if (currentRoom) {
            addMessageToHistory(currentRoom, user, message);
            // Відображаємо тільки якщо це поточна кімната
            if (user !== 'System' || message.includes(currentRoom)) {
                displayMessage(user, message);
            }
        }
    });

    // Запуск з'єднання
    async function start() {
        try {
            await connection.start();
            console.log('SignalR Connected.');
        } catch (err) {
            console.log(err);
            setTimeout(start, 5000);
        }
    }

    connection.onclose(async () => {
        await start();
    });

    start();
});