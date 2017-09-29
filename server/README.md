# Setup new version on production server

Deploy new version
```
/var/www/new.3rdstreetadr.com_booking
mkdir v1.1.1
cd v1.1.1
git clone git@bitbucket.org:trexanhlab/booking-server.git server
cd server 
git fetch 
git checkout 1.1.1
npm install
cp ../../v1.1.0/server/config/production.json config
sudo chmod +x run_server.sh
cd ..

git clone git@bitbucket.org:trexanhlab/booking-client.git client
cd client
git fetch 
git checkout 1.1.1
bower install
cp ../../v1.1.0/client/app-config.js .
cp ../../v1.1.0/client/gulp-config.json .
npm install
gulp
```

Running new server
```
# kill previous version process
sudo pm2 delete booking_production
cd server
sudo ./run_server.sh
```

Update crontab content
```
# update crontab
sudo crontab -e
```
with new content
```
@reboot /var/www/new.3rdstreetadr.com_booking/v1.1.1/server/run_server.sh

*/30 * * * * NODE_ENV=production /usr/bin/node /var/www/new.3rdstreetadr.com_booking/v1.1.1/server/bin/cli.js reminder  >/dev/null 2>&1
```

## todo

- Setup link to current version
- Crontab use linked folder

# Upgrate from 1.0.0 to 1.1.0

```
npm install -g migrate

migrate
```


# Current developement server state
## http://booking.site.trexanhlab.com
```
# CODE FOLDER
/var/www/nodeapps/booking

PORT=8008
NODE_ENV=production

# Restart server
NODE_ENV=production PORT=8008 forever restart bin/www.js


# DATABASE
booking-pro


# CRON
*/30 * * * * NODE_ENV=production /usr/bin/node /var/www/nodeapps/booking/server/bin/cli.js reminder >/dev/null 2>&1
```
