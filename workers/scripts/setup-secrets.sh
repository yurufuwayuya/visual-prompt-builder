#!/bin/bash

# Cloudflare Workers Secrets Setup Script
# This script helps set up secrets for both development and production environments

echo "Cloudflare Workers Secrets Setup"
echo "================================"

# Function to set secret
set_secret() {
    local secret_name=$1
    local env=$2
    
    echo ""
    echo "Setting $secret_name for $env environment..."
    
    if [ "$env" = "production" ]; then
        wrangler secret put $secret_name --env production
    else
        wrangler secret put $secret_name
    fi
}

# Function to set all secrets for an environment
set_all_secrets() {
    local env=$1
    
    echo ""
    echo "Setting up secrets for $env environment"
    echo "---------------------------------------"
    
    set_secret "IMAGE_API_KEY" $env
    set_secret "TRANSLATION_API_KEY" $env
    set_secret "R2_ACCESS_KEY_ID" $env
    set_secret "R2_SECRET_ACCESS_KEY" $env
}

# Main menu
echo ""
echo "Select an option:"
echo "1) Set up all secrets for development"
echo "2) Set up all secrets for production"
echo "3) Set up a specific secret"
echo "4) Exit"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        set_all_secrets "development"
        ;;
    2)
        set_all_secrets "production"
        ;;
    3)
        echo ""
        echo "Select secret to set:"
        echo "1) IMAGE_API_KEY"
        echo "2) TRANSLATION_API_KEY"
        echo "3) R2_ACCESS_KEY_ID"
        echo "4) R2_SECRET_ACCESS_KEY"
        
        read -p "Enter secret number (1-4): " secret_choice
        
        echo ""
        echo "Select environment:"
        echo "1) Development"
        echo "2) Production"
        
        read -p "Enter environment (1-2): " env_choice
        
        case $secret_choice in
            1) secret_name="IMAGE_API_KEY" ;;
            2) secret_name="TRANSLATION_API_KEY" ;;
            3) secret_name="R2_ACCESS_KEY_ID" ;;
            4) secret_name="R2_SECRET_ACCESS_KEY" ;;
            *) echo "Invalid choice"; exit 1 ;;
        esac
        
        case $env_choice in
            1) env="development" ;;
            2) env="production" ;;
            *) echo "Invalid choice"; exit 1 ;;
        esac
        
        set_secret $secret_name $env
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Setup completed!"