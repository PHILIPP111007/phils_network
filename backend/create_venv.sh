#!/bin/bash

# This script creates python venv

RED='\033[0;31m'
NC='\033[0m' # No Color
venvActived="venv activated"

if [ ! -d "venv" ]
    then
        python3 -m venv venv
    else
        if [ -d "venv" ]; then source $PWD/venv/bin/activate; echo $venvActived; fi
fi

pip install --upgrade pip

if [ -f "requirements.in" ]
    then
        pip install -r requirements.in
    else
        if [ -f "requirements.txt" ]
            then
                pip install -r requirements.txt
            else
                printf "${RED}requirements file does not exists${NC}
"
        fi
fi

pip list

echo $'\nvenv created!'