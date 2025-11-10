#!/bin/sh

# Runs uvicorn

uvicorn settings.asgi:application --host 0.0.0.0 --port 8080 --workers 1 --reload --loop uvloop