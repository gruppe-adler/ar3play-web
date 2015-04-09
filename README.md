Arma3 mission replays.

# Prerequisites

* [`sock.dll` / `sock.so` Arma3 server extension](http://forums.bistudio.com/showthread.php?178327-Node-js-Extension-for-Arma-3-%28sock-sqf-sock-dll-sock-rpc%29)
* [NodeJS](https://nodejs.org)/ (0.10 or so?)
* [Redis](http://redis.io/)

# Parts of the whole

* [Server](https://github.com/gruppe-adler/ar3play-server) >= 2.0.0
* Arma3-Server
	* [example mission](https://github.com/gruppe-adler/ar3play-examplemission.stratis) **OR**
	* [Arma Serveraddon](https://github.com/gruppe-adler/ar3play-addon)
* [Webclient](https://github.com/gruppe-adler/ar3play-web) (this repo)

# Installation of this thing here

* clone
* put [10T's Stratis map](http://forums.bistudio.com/showthread.php?178671-Tiled-maps-Google-maps-compatible-%28WIP%29) and others under maptiles
* copy scripts/config.js.example to scripts/config.js , edit and point at the REST interface of one **ar3play-server** instance
* configuration for islands is in worlds.js, in case you want to adjust zoom levels and geo mapping
* go to index.html (*webserver not necessary*)

Code here is not as nicely done as the server part *cough *cough. 
Nice things like requirejs, angular or similar will have to wait :P

# Usage

There shouldnt be any big gotchas. One hint: at the very bottom, beneath the map, there is 
* the place to change the backend (ar3play-server) instance -> see config.js
* an input field to enter a password for ar3play-server authentication. Needed for deleting replays! The password will be put into localstorage, so you'll have to enter it once only.
