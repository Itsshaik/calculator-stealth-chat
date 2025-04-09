document.addEventListener('DOMContentLoaded', function() {
    const contactId = window.location.pathname.split('/').pop();
    let securitySocket = null;
    let isConnected = false;
    
    // Connect to the WebSocket
    function connectWebSocket() {
        // Determine protocol based on page protocol (http -> ws, https -> wss)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsURL = `${protocol}//${window.location.host}/ws/security/${contactId}/`;
        
        securitySocket = new WebSocket(wsURL);
        
        securitySocket.onopen = function(e) {
            console.log('Security verification WebSocket connected');
            isConnected = true;
        };
        
        securitySocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            
            switch(data.type) {
                case 'security_data':
                    updateSecurityDisplay(data);
                    break;
                case 'security_verified':
                    handleVerificationStatus(data.verified);
                    break;
            }
        };
        
        securitySocket.onclose = function(e) {
            console.log('Security verification WebSocket disconnected, attempting to reconnect...');
            isConnected = false;
            
            // Try to reconnect after a short delay
            setTimeout(function() {
                connectWebSocket();
            }, 3000);
        };
        
        securitySocket.onerror = function(e) {
            console.error('WebSocket error:', e);
        };
    }
    
    // Update security display with received data
    function updateSecurityDisplay(data) {
        // Update security code display if needed
        if (data.security_code) {
            const codeDisplay = document.querySelectorAll('.digit-group');
            if (codeDisplay.length > 0) {
                const codeParts = data.security_code.split(' ');
                codeParts.forEach((part, index) => {
                    if (index < codeDisplay.length) {
                        codeDisplay[index].textContent = part;
                    }
                });
            }
        }
        
        // Update QR code if needed
        if (data.qr_data && document.getElementById('qrcode')) {
            const qrContainer = document.getElementById('qrcode');
            qrContainer.innerHTML = ''; // Clear existing QR code
            
            var typeNumber = 0;
            var errorCorrectionLevel = 'L';
            var qr = qrcode(typeNumber, errorCorrectionLevel);
            qr.addData(data.qr_data);
            qr.make();
            qrContainer.innerHTML = qr.createImgTag(6);
        }
        
        // Update verification status
        handleVerificationStatus(data.verified);
    }
    
    // Handle verification status updates
    function handleVerificationStatus(verified) {
        const statusIndicator = document.querySelector('.status-indicator');
        const verifyButton = document.querySelector('button[type="submit"]');
        
        if (statusIndicator) {
            statusIndicator.classList.toggle('verified', verified);
            statusIndicator.classList.toggle('unverified', !verified);
        }
        
        const statusText = document.querySelector('.status-indicator + p');
        if (statusText) {
            statusText.textContent = `Status: ${verified ? 'Verified' : 'Not Verified'}`;
        }
        
        // Hide verify button if already verified
        if (verified && verifyButton) {
            verifyButton.closest('form').style.display = 'none';
        }
    }
    
    // Handle the verify button click
    const verifyForm = document.querySelector('form');
    if (verifyForm) {
        verifyForm.addEventListener('submit', function(e) {
            if (isConnected) {
                e.preventDefault(); // Don't submit the form via HTTP
                
                // Send verification message via WebSocket
                securitySocket.send(JSON.stringify({
                    'type': 'verify_security'
                }));
            }
            // If not connected, let the form submit normally for server-side handling
        });
    }
    
    // Connect WebSocket on page load
    connectWebSocket();
});