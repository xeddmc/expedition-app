#!/bin/bash

apt-cache clean

apt-get update

apt-get install --fix-missing -y bash git wget tmux bash libfontconfig

ln -s /usr/bin/nodejs /usr/bin/node

echo "Installing nvm"

wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash

source ~/.bashrc

echo "Installing node v8.1.4 through nvm"

bash -c 'chmod a+x /root/.nvm/nvm.sh && /root/.nvm/nvm.sh install v8.1.4 && /root/.nvm/nvm
.sh alias default v8.1.4'
