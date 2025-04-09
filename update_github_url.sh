#!/bin/bash

# First, get the current ngrok URL
./get_ngrok_url.sh
current_url=$(cat current_ngrok_url.txt)

if [ -z "$current_url" ]; then
    echo "Error: Could not get the current ngrok URL"
    exit 1
fi

# Update GitHub repository description
echo "Updating GitHub repository description with the current URL: $current_url"
curl -s -X PATCH \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Itsshaik/calculator-stealth-chat \
  -d "{\"description\":\"A secure messaging application disguised as a calculator app, with end-to-end encryption using the Signal Protocol. Current URL: $current_url\"}" > /dev/null

echo "GitHub repository description updated successfully"
echo "Your app is available at: $current_url"