document.addEventListener('DOMContentLoaded', function() {
    const display = document.getElementById('display');
    const calculatorLog = document.getElementById('calculatorLog');
    const passwordModal = document.getElementById('passwordModal');
    const cancelPasswordBtn = document.getElementById('cancelPassword');
    const calculatorContainer = document.querySelector('.calculator-container');
    const angleModeIndicator = document.getElementById('angleModeIndicator');
    const memoryIndicator = document.getElementById('memoryIndicator');
    const scientificButtons = document.querySelector('.calculator-buttons-scientific');
    
    let currentInput = '0';
    let previousInput = '0';
    let operation = null;
    let resetInput = false;
    let calculatorPassword = '';
    let potentialPasswordMode = false;
    let angleMode = 'DEG'; // DEG or RAD
    let memoryValue = 0;
    let scientificVisible = true;
    
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
            // Basic operations
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
                
            // Scientific calculator functions
            case 'sin':
                handleTrigFunction(Math.sin);
                break;
            case 'cos':
                handleTrigFunction(Math.cos);
                break;
            case 'tan':
                handleTrigFunction(Math.tan);
                break;
            case 'square':
                handlePowerFunction(2);
                break;
            case 'cube':
                handlePowerFunction(3);
                break;
            case 'sqrt':
                handleSquareRoot();
                break;
            case 'cbrt':
                handleCubeRoot();
                break;
            case 'log':
                handleLogarithm(10); // Base 10 logarithm
                break;
            case 'ln':
                handleLogarithm(Math.E); // Natural logarithm
                break;
            case 'exp':
                handleExponential(Math.E); // e^x
                break;
            case 'pow10':
                handleExponential(10); // 10^x
                break;
            case 'factorial':
                handleFactorial();
                break;
            case 'pi':
                currentInput = Math.PI.toString();
                resetInput = true;
                break;
            case 'e':
                currentInput = Math.E.toString();
                resetInput = true;
                break;
                
            // Memory functions
            case 'memoryStore':
                handleMemoryStore();
                break;
            case 'memoryRecall':
                handleMemoryRecall();
                break;
            case 'memoryAdd':
                handleMemoryAdd();
                break;
            case 'memoryClear':
                handleMemoryClear();
                break;
                
            // Mode toggles
            case 'toggleMode':
                toggleAngleMode();
                break;
            case 'toggleScientific':
                toggleScientificCalculator();
                break;
        }
    }
    
    // Handle trigonometric functions (sin, cos, tan)
    function handleTrigFunction(func) {
        const current = parseFloat(currentInput);
        if (!isNaN(current)) {
            // Convert from degrees to radians if in DEG mode
            let value = current;
            if (angleMode === 'DEG') {
                value = value * (Math.PI / 180);
            }
            
            currentInput = func(value).toString();
            resetInput = true;
        }
    }
    
    // Handle power functions (x², x³)
    function handlePowerFunction(power) {
        const current = parseFloat(currentInput);
        if (!isNaN(current)) {
            currentInput = Math.pow(current, power).toString();
            resetInput = true;
        }
    }
    
    // Handle square root
    function handleSquareRoot() {
        const current = parseFloat(currentInput);
        if (!isNaN(current) && current >= 0) {
            currentInput = Math.sqrt(current).toString();
            resetInput = true;
        } else if (!isNaN(current) && current < 0) {
            currentInput = 'Error'; // Can't take square root of negative number
            resetInput = true;
        }
    }
    
    // Handle cube root
    function handleCubeRoot() {
        const current = parseFloat(currentInput);
        if (!isNaN(current)) {
            currentInput = Math.cbrt(current).toString();
            resetInput = true;
        }
    }
    
    // Handle logarithm (log, ln)
    function handleLogarithm(base) {
        const current = parseFloat(currentInput);
        if (!isNaN(current) && current > 0) {
            if (base === 10) {
                currentInput = Math.log10(current).toString();
            } else {
                currentInput = Math.log(current).toString();
            }
            resetInput = true;
        } else if (!isNaN(current) && current <= 0) {
            currentInput = 'Error'; // Can't take log of negative number or zero
            resetInput = true;
        }
    }
    
    // Handle exponential (e^x, 10^x)
    function handleExponential(base) {
        const current = parseFloat(currentInput);
        if (!isNaN(current)) {
            currentInput = Math.pow(base, current).toString();
            resetInput = true;
        }
    }
    
    // Handle factorial
    function handleFactorial() {
        const current = parseFloat(currentInput);
        if (!isNaN(current) && current >= 0 && Number.isInteger(current)) {
            let result = 1;
            for (let i = 2; i <= current; i++) {
                result *= i;
            }
            currentInput = result.toString();
            resetInput = true;
        } else {
            currentInput = 'Error'; // Can't calculate factorial of negative or non-integer
            resetInput = true;
        }
    }
    
    // Memory functions
    function handleMemoryStore() {
        const current = parseFloat(currentInput);
        if (!isNaN(current)) {
            memoryValue = current;
            memoryIndicator.textContent = 'M';
        }
    }
    
    function handleMemoryRecall() {
        if (memoryIndicator.textContent === 'M') {
            currentInput = memoryValue.toString();
            resetInput = true;
        }
    }
    
    function handleMemoryAdd() {
        const current = parseFloat(currentInput);
        if (!isNaN(current)) {
            memoryValue += current;
            memoryIndicator.textContent = 'M';
        }
    }
    
    function handleMemoryClear() {
        memoryValue = 0;
        memoryIndicator.textContent = '';
    }
    
    // Toggle between DEG and RAD mode
    function toggleAngleMode() {
        angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
        angleModeIndicator.textContent = angleMode;
    }
    
    // Toggle scientific calculator visibility (for mobile view)
    function toggleScientificCalculator() {
        if (window.innerWidth <= 768) {
            scientificVisible = !scientificVisible;
            if (scientificVisible) {
                scientificButtons.classList.add('visible');
            } else {
                scientificButtons.classList.remove('visible');
            }
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
        const ctrlKey = event.ctrlKey;
        const shiftKey = event.shiftKey;
        
        // Prevent default behavior for keys we're handling
        if (/[\d+\-*/.=%^!]/.test(key) || key === 'Enter' || key === 'Backspace' || key === 'Escape' ||
            (ctrlKey && /[sctl]/.test(key.toLowerCase())) || 
            (shiftKey && key === '^')) {
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
        // Handle basic operations
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
        // Handle scientific functions with keyboard shortcuts
        else if (ctrlKey && key.toLowerCase() === 's') {
            handleTrigFunction(Math.sin);
        }
        else if (ctrlKey && key.toLowerCase() === 'c') {
            handleTrigFunction(Math.cos);
        }
        else if (ctrlKey && key.toLowerCase() === 't') {
            handleTrigFunction(Math.tan);
        }
        else if (key === '^' || (shiftKey && key === '^')) {
            handlePowerFunction(2);
        }
        else if (ctrlKey && key.toLowerCase() === 'r') {
            handleSquareRoot();
        }
        else if (ctrlKey && key.toLowerCase() === 'l') {
            handleLogarithm(10);
        }
        else if (key === '!') {
            handleFactorial();
        }
        // Memory functions
        else if (key === 'm' && ctrlKey && shiftKey) {
            handleMemoryStore();
        }
        else if (key === 'm' && ctrlKey) {
            handleMemoryRecall();
        }
        else if (key === 'm' && shiftKey) {
            handleMemoryAdd();
        }
        else if (key === 'm') {
            handleMemoryClear();
        }
        // Toggle DEG/RAD mode
        else if (key.toLowerCase() === 'd' && ctrlKey) {
            toggleAngleMode();
        }
        
        updateDisplay();
    });
});
