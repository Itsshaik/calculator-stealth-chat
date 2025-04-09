# Stealth Messaging App

A secure messaging application disguised as a calculator app, offering end-to-end encrypted communications similar to WhatsApp.

## Features

- End-to-end encryption using the Signal Protocol
- Calculator interface as a stealth entrance to the messaging app
- WebSocket support for real-time messaging
- Read receipts and message delivery indicators
- Security verification with QR codes and security numbers
- Perfect forward secrecy

## How to Access

### Quick Start

When you open this Replit project, two workflows will automatically start:

1. **Django ASGI Server** - Runs the application on port 5000
2. **Ngrok Tunnel** - Creates a public URL to access the application from anywhere

### Getting the Current URL

To get the current URL for accessing your application:

```bash
./get_ngrok_url.sh
```

This will display the URL and also save it to `current_ngrok_url.txt` for future reference.

**Note:** The ngrok URL will change each time you restart the application (free plan limitation).

### Manually Starting the Application

If the workflows are not running, you can start them manually:

1. Start the Django server:
   ```bash
   workflows_set_run_config_tool Django ASGI Server "pip install django channels uvicorn websockets cryptography && python manage.py migrate && DJANGO_SETTINGS_MODULE=calculator_app.settings uvicorn calculator_app.asgi:application --host 0.0.0.0 --port 5000"
   ```

2. Start the ngrok tunnel:
   ```bash
   workflows_set_run_config_tool Ngrok Tunnel "./setup_ngrok.sh"
   ```

## Usage Instructions

1. Access the application using the ngrok URL
2. Register a new account
3. Set up your calculator password
4. Log out and access the calculator interface
5. Enter your calculator password to access the messaging features
6. Add contacts and start messaging securely!

## Security Notes

- Private keys are stored only on the client side for true end-to-end encryption
- The Signal Protocol implementation provides perfect forward secrecy
- Security verification helps ensure you're talking to the right person