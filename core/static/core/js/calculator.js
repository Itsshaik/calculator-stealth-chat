document.addEventListener('DOMContentLoaded', function() {
    const display = document.getElementById('display');
    const calculatorLog = document.getElementById('calculatorLog');
    const passwordModal = document.getElementById('passwordModal');
    const cancelPasswordBtn = document.getElementById('cancelPassword');
    const calculatorContainer = document.querySelector('.calculator-container');
    
    let currentInput = '0';
    let previousInput = '0';
    let operation = null;
    let resetInput = false;
    let calculatorPassword = '';
    let potentialPasswordMode = false;
    
    // Calculator button handlers
    document.querySelectorAll('.calculator-button').forEach(button => {
        button.addEventListener('click', () => {
            const value = button.getAttribute('data-value');
            const action = button.getAttribute('data-action');
            
            if (value) {
                handleNumberInput(value);
            } else if (action) {
                handleAction(action);
            }
            
            updateDisplay();
        });
    });
    
    // Handle number input
    function handleNumberInput(value) {
        // Special check for potential password mode
        if (potentialPasswordMode) {
            if (value >= '0' && value <= '9') {
                calculatorPassword += value;
                
                // Check for password sequence
                if (calculatorPassword.length >= 4) {
                    // Password sequence detected, show password modal
                    showPasswordModal();
                    calculatorPassword = '';
                    potentialPasswordMode = false;
                }
            } else {
                calculatorPassword = '';
                potentialPasswordMode = false;
            }
        }
        
        if (currentInput === '0' || resetInput) {
            currentInput = value;
            resetInput = false;
        } else {
            currentInput += value;
        }
    }
    
    // Handle operations and special actions
    function handleAction(action) {
        switch(action) {
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
                handleOperation(action);
                break;
            case 'percent':
                handlePercent();
                break;
            case 'calculate':
                if (potentialPasswordMode) {
                    showPasswordModal();
                    calculatorPassword = '';
                    potentialPasswordMode = false;
                } else {
                    // Enable password mode
                    potentialPasswordMode = true;
                    calculatorPassword = '';
                    
                    // Also perform normal calculation
                    calculate();
                }
                break;
            case 'clear':
                clear();
                break;
            case 'backspace':
                backspace();
                break;
        }
    }
    
    // Handle basic operations
    function handleOperation(op) {
        if (operation !== null) {
            calculate();
        }
        
        previousInput = currentInput;
        operation = op;
        resetInput = true;
        updateCalculatorLog();
    }
    
    // Calculate result
    function calculate() {
        let result;
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        switch (operation) {
            case 'add':
                result = prev + current;
                break;
            case 'subtract':
                result = prev - current;
                break;
            case 'multiply':
                result = prev * current;
                break;
            case 'divide':
                if (current === 0) {
                    result = 'Error';
                } else {
                    result = prev / current;
                }
                break;
            default:
                return;
        }
        
        // Format the result
        currentInput = result.toString();
        operation = null;
        resetInput = true;
        updateCalculatorLog();
    }
    
    // Handle percent
    function handlePercent() {
        const current = parseFloat(currentInput);
        if (!isNaN(current)) {
            currentInput = (current / 100).toString();
        }
    }
    
    // Clear calculator
    function clear() {
        currentInput = '0';
        previousInput = '0';
        operation = null;
        resetInput = false;
        calculatorLog.textContent = '';
    }
    
    // Backspace
    function backspace() {
        if (currentInput.length > 1) {
            currentInput = currentInput.slice(0, -1);
        } else {
            currentInput = '0';
        }
    }
    
    // Update display
    function updateDisplay() {
        // Format large numbers with commas
        let displayValue = currentInput;
        
        // Only format if it's a number
        if (!isNaN(parseFloat(displayValue)) && displayValue !== 'Error') {
            // Split by decimal point to handle integers and decimals separately
            const parts = displayValue.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            displayValue = parts.join('.');
        }
        
        display.textContent = displayValue;
    }
    
    // Update calculator log
    function updateCalculatorLog() {
        let operationSymbol = '';
        
        switch (operation) {
            case 'add':
                operationSymbol = '+';
                break;
            case 'subtract':
                operationSymbol = '-';
                break;
            case 'multiply':
                operationSymbol = '×';
                break;
            case 'divide':
                operationSymbol = '÷';
                break;
        }
        
        calculatorLog.textContent = `${previousInput} ${operationSymbol}`;
    }
    
    // Show password modal
    function showPasswordModal() {
        passwordModal.style.display = 'flex';
        document.getElementById('calculatorPassword').focus();
    }
    
    // Close password modal
    cancelPasswordBtn.addEventListener('click', function() {
        passwordModal.style.display = 'none';
    });
    
    // Initial display update
    updateDisplay();
    
    // Keyboard support
    document.addEventListener('keydown', function(event) {
        const key = event.key;
        
        // Prevent default behavior for keys we're handling
        if (/[\d+\-*/.=%]/.test(key) || key === 'Enter' || key === 'Backspace' || key === 'Escape') {
            event.preventDefault();
        }
        
        // Handle number keys
        if (/\d/.test(key)) {
            handleNumberInput(key);
        }
        // Handle decimal point
        else if (key === '.') {
            handleNumberInput('.');
        }
        // Handle operations
        else if (key === '+') {
            handleOperation('add');
        }
        else if (key === '-') {
            handleOperation('subtract');
        }
        else if (key === '*') {
            handleOperation('multiply');
        }
        else if (key === '/') {
            handleOperation('divide');
        }
        // Handle equals and Enter
        else if (key === '=' || key === 'Enter') {
            if (potentialPasswordMode) {
                showPasswordModal();
                calculatorPassword = '';
                potentialPasswordMode = false;
            } else {
                potentialPasswordMode = true;
                calculatorPassword = '';
                calculate();
            }
        }
        // Handle backspace
        else if (key === 'Backspace') {
            backspace();
        }
        // Handle clear (Escape key)
        else if (key === 'Escape') {
            clear();
        }
        // Handle percent
        else if (key === '%') {
            handlePercent();
        }
        
        updateDisplay();
    });
});
