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
  pm2 start ./dist/peerServer.js
elif [[ $1 = "stop" ]]
then
  pm2 stop index
  pm2 stop peerServer
elif [[ $1 = "restart" ]]
then
  pm2 restart index
  pm2 restart peerServer
elif [[ $1 = "install" ]]
then
  sudo apt update -y
  sudo apt upgrade -y
  sudo apt install mysql-server -y
  sudo apt install curl -y
  sudo apt install software-properties-common -y
  sudo add-apt-repository ppa:deadsnakes/ppa -y
  sudo apt update -y
  sudo apt install python3.9 -y
  sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.9 1
  sudo update-alternatives --config python3
  sudo apt install python3.9-distutils -y
  sudo curl https://bootstrap.pypa.io/pip/get-pip.py -o g.py
  sudo python3 g.py
  sudo rm g.py
  sudo update-alternatives --install /usr/bin/pip3 pip3 /usr/bin/pip3.9 1
  sudo pip3 install requests
  sudo pip3 install pymysql
  sudo curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  sudo apt install nodejs -y
  sudo apt install npm -y
  sudo npm i npm -g
  sudo npm i pm2 -g
  sudo apt install nano -y
  sudo npm i
  sudo ./static/npm i  
  sudo node configure_mysql.js
  sudo ./controller.sh start
fi