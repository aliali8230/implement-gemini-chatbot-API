const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

/**
 * Appends a new message to the chat box.
 * @param {string} sender - The sender of the message ('user' or 'bot').
 * @param {string} text - The content of the message.
 * @returns {HTMLElement} The created message element.
 */
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  // Automatically scroll to the latest message
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

// Listen for the form submission event
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1. Add the user's message to the chat box
  appendMessage('user', userMessage);
  input.value = '';

  // 2. Show a temporary "Thinking..." message and get a reference to the element
  const thinkingMessageElement = appendMessage('bot', 'Thinking...');

  try {
    // 3. Send the user's message to the backend API
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    // 4. Replace the "Thinking..." message with the AI's actual response
    if (data && data.reply) {
      thinkingMessageElement.textContent = data.reply;
    } else {
      // Handle cases where the server responds but with no result
      thinkingMessageElement.textContent = 'Sorry, no response received.';
    }
  } catch (error) {
    console.error('Failed to fetch chat response:', error);
    // 5. Handle network errors or other issues with the fetch call
    thinkingMessageElement.textContent = 'Failed to get response from server.';
  }
});