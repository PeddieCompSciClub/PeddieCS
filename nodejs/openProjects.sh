#echo 'Opening Project'
# cd
# sudo systemctl stop redis
# fuser -k [port #]/tcp
# redis-server
# cd /var/www/CSProjects/live/Project/nodejs
# node app.js

#ChatGPT Name Generator
echo 'Opening Name-Generator'
cd
sudo systemctl stop redis
fuser -k [5623]/tcp
redis-server
cd /var/www/CSProjects/live/Name-Generator/nodejs
node app.js
