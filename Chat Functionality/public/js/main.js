const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages')

const socket = io();

//Message from server
socket.on('message', message =>{
    console.log(message);
    outputMessage(message);

    //Scroll Top
    chatMessages.scrollTop =    chatMessages.scrollHeight;
});

//Message Submit
chatForm .addEventListener('submit', (e)=>{
    e.preventDefault();

    const msg = e.target.elements.msg.value;

    console.log(msg);
});

//Output to DOM
function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">Brad <span>9:12pm</span></p>
    <p class="text">
        ${message}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}