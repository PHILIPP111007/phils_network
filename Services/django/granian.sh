#!/bin/sh

# Runs granian
# Now not supports Django Channels WebSockets

granian settings.asgi:application --interface asginl --ws --host 0.0.0.0 --port 8080 --workers 1 --log --reload