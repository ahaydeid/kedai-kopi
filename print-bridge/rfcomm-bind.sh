#!/bin/bash

# Auto-bind RFCOMM 0 to RPP02N Bluetooth MAC Address
MAC_ADDRESS="02:14:3E:F4:09:D1"
DEVICE_PATH="/dev/rfcomm0"

if [ ! -e "$DEVICE_PATH" ]; then
    echo "[RFCOMM Bind] Binding $DEVICE_PATH to Bluetooth MAC $MAC_ADDRESS..."
    sudo rfcomm bind 0 "$MAC_ADDRESS"
    sudo chmod 666 "$DEVICE_PATH" 2>/dev/null || true
    echo "[RFCOMM Bind] Bound successfully!"
else
    echo "[RFCOMM Bind] $DEVICE_PATH already exists and bound."
fi
