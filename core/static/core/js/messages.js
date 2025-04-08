document.addEventListener('DOMContentLoaded', function() {
    // Message form submission
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const formData = new FormData(messageForm);
            const receiverId = formData.get('receiver_id');
            const content = formData.get('content');
            
            if (content.trim() === '') return;
            
            // Get CSRF token
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            // Send message via AJAX
            fetch('/api/send-message/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'receiver_id': receiverId,
                    'content': content,
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Clear the input
                    messageForm.reset();
                    
                    // Add message to the UI
                    addMessageToUI(content, true, new Date());
                    
                    // Scroll to bottom
                    scrollToBottom();
                } else {
                    console.error('Error sending message:', data.message);
                    alert('Failed to send message: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while sending the message.');
            });
        });
    }
    
    // Contact selection
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        item.addEventListener('click', function() {
            const contactId = this.getAttribute('data-contact-id');
            window.location.href = `/messages/?contact=${contactId}`;
        });
    });
    
    // Function to add a message to the UI
    function addMessageToUI(content, isSent, timestamp) {
        const messageList = document.getElementById('messageList');
        if (!messageList) return;
        
        const messageItem = document.createElement('div');
        messageItem.className = `message-item ${isSent ? 'sent' : 'received'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        
        // Format timestamp
        const formattedTime = formatTimestamp(timestamp);
        messageTime.textContent = formattedTime;
        
        messageItem.appendChild(messageContent);
        messageItem.appendChild(messageTime);
        
        messageList.appendChild(messageItem);
    }
    
    // Function to format timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // Function to scroll to the bottom of message list
    function scrollToBottom() {
        const messageList = document.getElementById('messageList');
        if (messageList) {
            messageList.scrollTop = messageList.scrollHeight;
        }
    }
    
    // Initial scroll to bottom
    scrollToBottom();
    
    // Poll for new messages every 5 seconds if a contact is selected
    const selectedContact = document.querySelector('.contact-item.active');
    if (selectedContact) {
        const contactId = selectedContact.getAttribute('data-contact-id');
        
        function pollMessages() {
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            fetch(`/api/get-messages/${contactId}/`, {
                headers: {
                    'X-CSRFToken': csrfToken,
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    updateMessages(data.messages);
                }
            })
            .catch(error => console.error('Error polling messages:', error));
        }
        
        // Update the UI with the latest messages
        function updateMessages(messages) {
            const messageList = document.getElementById('messageList');
            if (!messageList) return;
            
            // Clear existing messages
            messageList.innerHTML = '';
            
            if (messages.length === 0) {
                // Show empty state
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `
                    <i class="fas fa-comments"></i>
                    <p>No messages yet. Start a conversation!</p>
                `;
                messageList.appendChild(emptyState);
            } else {
                // Add messages
                messages.forEach(msg => {
                    addMessageToUI(msg.content, msg.is_self, msg.sent_on);
                });
                
                // Scroll to bottom
                scrollToBottom();
            }
        }
        
        // Start polling
        setInterval(pollMessages, 5000);
    }
});
