#!/bin/bash

# Wait a moment for ngrok to start up
sleep 2

# Get the public URL
URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4)

if [ -z "$URL" ]; then
    echo "Error: ngrok tunnel not found or not started."
    echo "Please make sure ngrok is running with './setup_ngrok.sh'"
    exit 1
else
    echo "Your application is available at:"
    echo "$URL"
    
    # Store the URL in a file for later reference
    echo "$URL" > current_ngrok_url.txt
fi