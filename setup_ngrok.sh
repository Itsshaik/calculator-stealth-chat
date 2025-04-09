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

# Start ngrok tunnel in the background
echo "Starting ngrok tunnel..."
./ngrok start calculator --config=ngrok.yml