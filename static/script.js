document.addEventListener("DOMContentLoaded", function () {
    loadChatHistory();

    document.getElementById("send-btn").addEventListener("click", sendMessage);
    document.getElementById("user-input").addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendMessage();
    });
});

async function sendMessage() {
    const inputField = document.getElementById("user-input");
    const message = inputField.value.trim();
    if (!message) return;

    const chatBox = document.getElementById("chat-box");
    
    // Add user message
    let userMessage = document.createElement("div");
    userMessage.className = "user-message";
    userMessage.textContent = message;
    chatBox.appendChild(userMessage);

    inputField.value = "";

    const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    });

    const data = await response.json();

    // Add bot message container (with bot icon)
    let botMessage = document.createElement("div");
    botMessage.className = "bot-message";
    botMessage.innerHTML = `<img src='/static/bot.png' class='icon'><span class='bot-text'></span>`;
    chatBox.appendChild(botMessage);

    let botText = botMessage.querySelector(".bot-text");

    // Typing effect
    let i = 0;
    function typeMessage() {
        if (i < data.response.length) {
            botText.textContent += data.response.charAt(i);
            i++;
            setTimeout(typeMessage, 30);
        }
    }
    typeMessage();

    chatBox.scrollTop = chatBox.scrollHeight;
}

function clearChat() {
    document.getElementById("chat-box").innerHTML = "";
}

function newChat() {
    fetch("/history", { method: "DELETE" })  // Clears session in Flask
        .then(() => location.reload());
}

// Load previous chat history on page load
function loadChatHistory() {
    fetch("/history")
        .then(response => response.json())
        .then(data => {
            const chatBox = document.getElementById("chat-box");
            data.forEach(msg => {
                let messageDiv = document.createElement("div");
                messageDiv.className = msg.role === "user" ? "user-message" : "bot-message";
                messageDiv.innerHTML = msg.role === "bot" 
                    ? `<img src='/static/bot.png' class='icon'><span class='bot-text'>${msg.content}</span>` 
                    : msg.content;
                chatBox.appendChild(messageDiv);
            });
        });
}
