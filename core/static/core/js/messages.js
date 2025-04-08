document.addEventListener('DOMContentLoaded', function() {
    // WebSocket connection
    let chatSocket = null;
    let messageQueue = [];
    const selectedContact = document.querySelector('.contact-item.active');
    
    // Message UI functions
    function addMessageToUI(content, isSent, timestamp, messageId = null) {
        const messageList = document.getElementById('messageList');
        if (!messageList) return;
        
        // Check if message with this ID already exists (to avoid duplicates)
        if (messageId && document.querySelector(`.message-item[data-message-id="${messageId}"]`)) {
            return;
        }
        
        const messageItem = document.createElement('div');
        messageItem.className = `message-item ${isSent ? 'sent' : 'received'}`;
        if (messageId) {
            messageItem.setAttribute('data-message-id', messageId);
        }
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        
        // Format timestamp
        const formattedTime = formatTimestamp(timestamp);
        
        // Add status indicators for sent messages
        if (isSent) {
            const statusSpan = document.createElement('span');
            statusSpan.className = 'message-status';
            
            // If message has an ID (from database), show single checkmark for sent
            if (messageId) {
                statusSpan.innerHTML = ' <i class="fas fa-check"></i>'; // Single checkmark for sent
            } else {
                // Message is still being sent (no ID yet)
                statusSpan.innerHTML = ' <i class="fas fa-clock"></i>'; // Clock for pending
            }
            
            messageTime.appendChild(document.createTextNode(formattedTime));
            messageTime.appendChild(statusSpan);
        } else {
            messageTime.textContent = formattedTime;
            
            // Mark this message as read if we're the receiver
            if (chatSocket && chatSocket.readyState === WebSocket.OPEN && messageId) {
                chatSocket.send(JSON.stringify({
                    'type': 'read_receipt',
                    'message_id': messageId
                }));
            }
        }
        
        messageItem.appendChild(messageContent);
        messageItem.appendChild(messageTime);
        
        messageList.appendChild(messageItem);
        
        // Scroll to bottom
        scrollToBottom();
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
    
    // Setup WebSocket connection if a contact is selected
    if (selectedContact) {
        const contactId = selectedContact.getAttribute('data-contact-id');
        
        // Try to establish WebSocket connection - fixed URL for Replit
        try {
            // Create WebSocket connection - with error handling
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/chat/${contactId}/`;
            console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);
            chatSocket = new WebSocket(wsUrl);
            
            chatSocket.onopen = function(e) {
                console.log('WebSocket connection established');
                
                // Send any queued messages
                while (messageQueue.length > 0) {
                    const queuedMessage = messageQueue.shift();
                    chatSocket.send(queuedMessage);
                }
            };
            
            chatSocket.onmessage = function(e) {
                console.log('WebSocket message received:', e.data);
                const data = JSON.parse(e.data);
                
                if (data.type === 'chat_message') {
                    // Check if message is from current user or contact
                    const isSent = data.sender_id === parseInt(document.querySelector('meta[name="user-id"]').content);
                    
                    // Add message to UI
                    addMessageToUI(data.message, isSent, new Date(data.timestamp), data.message_id);
                } 
                else if (data.type === 'read_receipt') {
                    // Update message status to read (double checkmark)
                    const messageId = data.message_id;
                    const messageItem = document.querySelector(`.message-item[data-message-id="${messageId}"]`);
                    
                    if (messageItem) {
                        const statusSpan = messageItem.querySelector('.message-status');
                        if (statusSpan) {
                            statusSpan.innerHTML = ' <i class="fas fa-check-double"></i>'; // Double checkmark for read
                        }
                    }
                }
            };
            
            chatSocket.onclose = function(e) {
                console.log('WebSocket connection closed');
                // Fallback to polling when WebSocket is closed
                initPolling(contactId);
            };
            
            chatSocket.onerror = function(e) {
                console.error('WebSocket error:', e);
                // Fallback to polling if WebSocket fails
                initPolling(contactId);
            };
        } catch (error) {
            console.error('Failed to establish WebSocket connection:', error);
            // Fallback to polling if WebSocket setup fails
            initPolling(contactId);
        }
    }
    
    // Load initial messages for the selected contact
    if (selectedContact) {
        const contactId = selectedContact.getAttribute('data-contact-id');
        loadInitialMessages(contactId);
    }
    
    function loadInitialMessages(contactId) {
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
        .catch(error => console.error('Error loading messages:', error));
    }
    
    // Fallback polling function in case WebSockets fail
    function initPolling(contactId) {
        console.log('Falling back to polling for messages');
        
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
        
        // Start polling
        setInterval(pollMessages, 5000);
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
                addMessageToUI(msg.content, msg.is_self, msg.sent_on, msg.id);
                
                // If message is sent by current user and is read, show double check mark
                if (msg.is_self && msg.is_read) {
                    const messageItem = document.querySelector(`.message-item[data-message-id="${msg.id}"]`);
                    if (messageItem) {
                        const statusSpan = messageItem.querySelector('.message-status');
                        if (statusSpan) {
                            statusSpan.innerHTML = ' <i class="fas fa-check-double"></i>'; // Double checkmark for read
                        }
                    }
                }
            });
        }
    }
    
    // Message form submission
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const formData = new FormData(messageForm);
            const content = formData.get('content');
            
            if (content.trim() === '') return;
            
            // Send message via WebSocket if connected
            if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
                chatSocket.send(JSON.stringify({
                    'type': 'chat_message',
                    'message': content
                }));
                
                // Clear the input
                messageForm.reset();
            } 
            // Queue message to send when connection is established or use fallback
            else if (chatSocket) {
                const message = JSON.stringify({
                    'type': 'chat_message',
                    'message': content
                });
                
                messageQueue.push(message);
                
                // If socket is closed or failed, use AJAX fallback
                if (chatSocket.readyState === WebSocket.CLOSED || chatSocket.readyState === WebSocket.CLOSING) {
                    sendMessageWithAjax(formData);
                }
            } 
            // Fallback to AJAX if WebSocket isn't available
            else {
                sendMessageWithAjax(formData);
            }
        });
    }
    
    // Fallback AJAX message sending
    function sendMessageWithAjax(formData) {
        const receiverId = formData.get('receiver_id');
        const content = formData.get('content');
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
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
            } else {
                console.error('Error sending message:', data.message);
                alert('Failed to send message: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while sending the message.');
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
});
