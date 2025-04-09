#!/bin/bash

# Make script executable (if needed)
chmod +x ngrok

# Create or update ngrok.yml with auth token
echo "version: \"2\"" > ngrok.yml
echo "authtoken: $NGROK_AUTH_TOKEN" >> ngrok.yml
echo "tunnels:" >> ngrok.yml
echo "  calculator:" >> ngrok.yml
echo "    proto: http" >> ngrok.yml
echo "    addr: 5000" >> ngrok.yml

# Start Django ASGI Server in the background
echo "Starting Django ASGI Server..."
pip install django channels uvicorn websockets cryptography
python manage.py migrate
DJANGO_SETTINGS_MODULE=calculator_app.settings uvicorn calculator_app.asgi:application --host 0.0.0.0 --port 5000 &

# Wait a moment for the server to start
sleep 3

# Start ngrok tunnel
echo "Starting ngrok tunnel..."
./ngrok start calculator --config=ngrok.yml