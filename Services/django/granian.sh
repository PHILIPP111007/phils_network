#!/bin/sh

# Runs granian

granian settings.asgi:application --interface asgi --host 0.0.0.0 --port 8080 --ws --workers 1