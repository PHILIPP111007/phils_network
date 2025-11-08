#!/bin/sh

# Runs granian

granian settings.asgi:application --interface asginl --ws --host 0.0.0.0 --port 8080 --workers 1 --log --reload