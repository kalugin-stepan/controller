#!/bin/bash

if [[ $1 = "" ]]
then
  echo "commands:"
  echo "  install"
  echo "  start"
  echo "  stop"
  echo "  restart"
elif [[ $1 = "start" ]]
then
  pm2 start ./dist/index.js
elif [[ $1 = "stop" ]]
then
  pm2 stop index
elif [[ $1 = "restart" ]]
then
  pm2 restart index
elif [[ $1 = "install" ]]
then
  sudo apt update -y
  sudo apt upgrade -y
  sudo apt install curl -y
  sudo apt install software-properties-common -y
  sudo add-apt-repository ppa:deadsnakes/ppa -y
  sudo apt update -y
  sudo curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  sudo apt install nodejs -y
  sudo apt install npm -y
  sudo npm i npm -g
  sudo npm i pm2 -g
  sudo apt install nano -y
  sudo npm i
  sudo ./controller.sh start
fi