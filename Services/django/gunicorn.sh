#!/bin/sh

# Runs gunicorn

gunicorn -c gunicorn.conf.py -b 0.0.0.0:8080