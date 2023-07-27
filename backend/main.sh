#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color
venvActived="venv activated"

# create_venv.sh
printf "${GREEN}This script creates venv and downloads packages from requirements file${NC}
run? [y / n] : "
read answer

if [ $answer = "y" ]
    then
        bash create_venv.sh
fi

# migrate.sh
printf "${GREEN}This script makes migrations${NC}
run? [y / n] : "
read answer

if [ $answer = "y" ]
    then
        bash migrate.sh
fi

echo $'\nDone!'