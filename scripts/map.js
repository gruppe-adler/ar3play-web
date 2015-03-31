
/*global google, $, _ */
/*
* Ursprung: (links unten): {lat: -2.8115, lng: -0}
* 1km lat === 0.188 ===>
* 1km lng === 0.189
*/
(function () {

    var
        tileSize = 256,
        currentMap,
        getIcon,
        markers = {},
        getWorld = (function () {
            var currentWorld,
                fn = function () {
                return worlds[currentWorld];
            };
            fn.setWorld = function (world) {
                currentWorld = world;
            };
            return fn;
        }());


    function isOutOfBounds(x, y, numTiles) {
        if (y < 0 || y >= numTiles) {
            return true;
        }
        if (x < 0 || x >= numTiles) {
            return true;
        }
    }

    function init(world) {
        getWorld.setWorld(world);

        var armaMapType = new google.maps.ImageMapType({
            getTileUrl: function (coord, zoom) {
                var x = coord.x;
                var y = coord.y;
                var numTiles = Math.pow(2, zoom - 1);
                var tileZoom = zoom - getWorld().initialZoom;
                x = x - numTiles;
                y = y - numTiles;

                var myY = Math.pow(2, tileZoom) - (y + 1);

                if (isOutOfBounds(x, myY, numTiles)) {
                    return null;
                }

                var baseURL = 'maptiles/' + getWorld().tileDir + '/';
                baseURL += [tileZoom, x, myY].join('/') + '.png';
                return baseURL;
            },
            tileSize: new google.maps.Size(tileSize, tileSize),
            isPng: true,
            minZoom: getWorld().initialZoom,
            maxZoom: getWorld().maxZoom,
            name: getWorld().name
        });


        currentMap = new google.maps.Map($('#map')[0], {
            zoom: getWorld().initialZoom,
            center: gameCoordsToLatLng(getWorld().center[0], getWorld().center[1]),
            mapTypeControlOptions: {
                mapTypeIds: ['armaMapType']
            },
            streetViewControl: false
        });
        currentMap.mapTypes.set('map', armaMapType);
        currentMap.setMapTypeId('map');
    }

    /**
     * in-game coordinates are in meters, with 0,0 at south west corner of map
     * @param x
     * @param y
     *
     * For simplicity's sake, I will translate
     *
     */
    function gameCoordsToLatLng(x, y) {
        return getWorld().metersToCoord(x, y);
    }
    function latLngToGameCoords(latLng) {
        return getWorld().coordToMeters(latLng);
    }

    function calculateDistance(x, y) {
        // I know I cant do this on a globe, but we're roughly on a plane here and close to the equator :)
        return Math.sqrt(x * x + y * y);
    }

    var moveMarkerSmoothlyInTwoSeconds = (function () {
        var
            currentlyMovingMarkers = [],
            currentlyMovingMarkerTargets = [];
        return function (marker, targetPos) {

            var existingIndex = currentlyMovingMarkers.indexOf(marker);
            if (existingIndex !== -1) {
                clearInterval(existingIndex);
                marker.setPosition(currentlyMovingMarkerTargets[existingIndex]);
                delete currentlyMovingMarkers[existingIndex];
                delete currentlyMovingMarkerTargets[existingIndex];
            }

            var
                targetTime = 2000,
                oldPos = marker.getPosition(),
                oldLat = oldPos.lat(),
                oldLng = oldPos.lng(),
                latDiff = (targetPos.lat() - oldLat),
                lngDiff = (targetPos.lng() - oldLng),
                dist = calculateDistance(latDiff, lngDiff),
                // 0.002 deg lat/lng are about 10 meters here
                // I want number of steps between 1 at 1m and 10 at 50m
                steps = Math.max(1, Math.min(10, 1000 * dist + 0.8)),
                //steps = Math.max(1, Math.min(10, dist / 0.02)),
                latDiffPerStep = latDiff / steps,
                lngDiffPerStep = lngDiff / steps,
                cnt = 0,
                intervalId;


            intervalId = setInterval(function () {
                if (!currentlyMovingMarkers[intervalId]) {
                    return;
                }
                cnt += 1;
                if (cnt >= steps) {
                    clearInterval(intervalId);
                    marker.setPosition(targetPos);
                    return;
                }
                marker.setPosition(new google.maps.LatLng(oldLat + cnt * latDiffPerStep, oldLng + cnt * lngDiffPerStep));

            }, targetTime / steps);

            currentlyMovingMarkers[intervalId] = marker;
            currentlyMovingMarkerTargets[intervalId] = targetPos;
        };
    }());

    function setIconIfChanged(marker, newIcon) {
        var oldIcon = marker.getIcon();

        if (oldIcon && oldIcon.url && oldIcon.url === newIcon.url) { // for unchanged rastered icons
            return;
        }
        // dont check for changes on svg icons - yet
        marker.setIcon(newIcon);
    }


    function updateMap(data) {
        _.each(data, function (val, name) {
            var m = markers[name] || new google.maps.Marker({
                    position: { lat: 0, lng: 0 },
                    map: currentMap,
                    title: name
                });

            if (val.position) {
                moveMarkerSmoothlyInTwoSeconds(m, gameCoordsToLatLng(val.position.x, val.position.y));
                m.zIndex = 1000 + (val.position.z || 0);
                //m.setPosition(gameCoordsToLatLng(val.position.x, val.position.y));
            }

            setIconIfChanged(m, getIcon(val));
            m.infowindow = m.infowindow || new google.maps.InfoWindow({
                content: '?'
            });
            m.infowindow.content = '<div>' + name + '</div>';
            markers[name] = m;
        });
    }

    getIcon = (function () {
        var
            mapSide = {
                'ind': 'independent',
                'civ': 'civilian'
            },
            mapClasstype = {
                'unknown': ''
            },
            mapVehicle = {
                'none': 'man',
                'unknown': 'vehicle'
            },
            colors = {
                blufor: '#004c9a',
                opfor: '#800000',
                ind: '#008001',
                civ: '#660080',
                empty: '#808000',
                dead: '#333333'
            },
            paths = {
                man: 'm -0.01694915,-16.14195 c 2.40699995,0 4.68399995,0.542 6.73499995,1.488 l -6.73499995,-9.488 -6.73500005,9.488 c 2.051,-0.946 4.327,-1.488 6.73500005,-1.488 z M 12.875,0 C 12.875,7.110666 7.110666,12.875 0,12.875 -7.110666,12.875 -12.875,7.110666 -12.875,0 c 0,-7.110666 5.764334,-12.875 12.875,-12.875 7.110666,0 12.875,5.764334 12.875,12.875 z',
                at: 'm 35.195446,10.880559 -6.262136,8.854369 c 1.911612,-0.881709 4.017786,-1.398058 6.262136,-1.398058 2.243417,0 4.380583,0.516349 6.291262,1.398058 l -6.291262,-8.854369 z m 0,10.485437 c -6.627728,0 -12,5.372272 -12,12 0,6.627728 5.372272,12 12,12 6.627728,0 12,-5.372272 12,-12 0,-6.627728 -5.372272,-12 -12,-12 z m -0.05825,1.368932 7.747572,11.038835 -7.45631,-2.563107 7.45631,10.631068 -7.747572,-2.650485 -7.601942,2.650485 7.310679,-10.631068 -7.310679,2.563107 7.601942,-11.038835 z',
                engineer: 'm 0.01483051,-22.449268 -6.29126201,8.825243 c 1.9116116,-0.881709 4.0469127,-1.368932 6.29126201,-1.368932 2.24341769,0 4.35145639,0.487223 6.26213599,1.368932 l -6.26213599,-8.825243 z m 0,10.485437 c -6.62772801,0 -12.00000051,5.3722729 -12.00000051,12.00000093 0,6.62772827 5.3722725,11.99999907 12.00000051,11.99999907 C 6.6425588,12.036169 12.01483,6.6638982 12.01483,0.03616993 12.01483,-6.5915581 6.6425588,-11.963831 0.01483051,-11.963831 z m -8.41747561,5.5339816 c 3.1260582,0 5.7511456,2.2035729 6.3495145,5.1553398 l 4.1359224,0 c 0.5983689,-2.9517669 3.2234566,-5.1553398 6.3495145,-5.1553398 l 0,3 c -1.8985627,0 -3.4660194,1.5665243 -3.4660194,3.46601933 0,1.89949527 1.5674567,3.43689337 3.4660194,3.43689337 l 0,3.0291262 c -2.9638831,0 -5.471534,-2.0232233 -6.2330097,-4.7475728 l -4.368932,0 c -0.7605437,2.7243495 -3.2691262,4.7475728 -6.2330097,4.7475728 l 0,-3.0291262 c 1.8994951,0 3.4660194,-1.5373981 3.4660194,-3.43689337 0,-1.89949503 -1.5665243,-3.46601933 -3.4660194,-3.46601933 l 0,-3 z',
                explosive: 'm 35.014207,13.15353 -6.739258,9.488607 c 2.051,-0.946 4.331258,-1.47526 6.739258,-1.47526 2.407,0 4.65573,0.52926 6.70573,1.47526 l -6.70573,-9.488607 z m 0,11.265625 c -7.111,0 -12.875,5.764001 -12.875,12.875001 0,7.111 5.764,12.875 12.875,12.875 7.111001,0 12.875001,-5.764 12.875001,-12.875 0,-7.111 -5.764,-12.875001 -12.875001,-12.875001 z m 0,2.179362 9.589193,16.529623 -19.211914,0 9.622721,-16.529623 z',
                leader: 'm 0,-22.514302 -6.25,8.84375 c 1.911612,-0.881709 4.00565,-1.375 6.25,-1.375 2.243417,0 4.37057,0.493291 6.28125,1.375 L 0,-22.514302 z m 0,10.5 c -6.627728,0 -12,5.3732052 -12,12.00000115 0,6.62772785 5.372272,11.99999885 12,11.99999885 6.627728,0 12,-5.372271 12,-11.99999885 C 12,-6.6410968 6.627728,-12.014302 0,-12.014302 z m 4.9375,3.1250012 c 1.659961,0.921786 3.016646,2.308789 3.9375,3.96875 L -4.90625,8.8606992 C -6.566211,7.9398443 -7.921964,6.550978 -8.84375,4.8919492 L 4.9375,-8.8893008 z',
                medic: 'm -0.01138641,-22.478681 -6.29126209,8.854369 c 1.9116116,-0.881709 4.0469126,-1.398058 6.29126209,-1.398058 2.24341751,0 4.35145631,0.516349 6.26213591,1.398058 l -6.26213591,-8.854369 z m 0,10.485437 c -6.62772809,0 -11.99999959,5.3732037 -11.99999959,11.99999981 0,6.62772819 5.3722715,12.00000019 11.99999959,12.00000019 6.62772821,0 12.00000041,-5.372272 12.00000041,-12.00000019 0,-6.62679611 -5.3722722,-11.99999981 -12.00000041,-11.99999981 z m 0,1.864078 c 1.00939812,0 1.99083491,0.1619412 2.91262141,0.4368927 l 0,4.6601941 4.0485437,-2.330097 c 1.4148349,1.3365437 2.4212038,3.0815534 2.8834953,5.038835 L 5.7847301,0.00675581 9.833274,2.3368529 C 9.3709825,4.2950665 8.3664777,6.0410082 6.9497787,7.3756878 l -4.0485437,-2.330097 0,4.6601941 c -0.9208544,0.2758838 -1.90229129,0.4368931 -2.91262141,0.4368931 -1.01033009,0 -1.99269899,-0.1619413 -2.91262129,-0.4368931 l 0,-4.6601941 -4.0485437,2.330097 C -8.3892505,6.0391441 -9.3928232,4.2950665 -9.8560462,2.3368529 L -5.8075029,0.00675581 -9.8560462,-2.3233412 c 0.463223,-1.9582137 1.4695919,-3.7032234 2.8834948,-5.038835 l 4.0485437,2.330097 0,-4.6601941 c 0.9199223,-0.2749515 1.9022912,-0.4368927 2.91262129,-0.4368927 z',
                mg: 'm 0,-22.46875 -6.28125,8.84375 c 1.9116116,-0.881709 4.0369005,-1.40625 6.28125,-1.40625 2.2434174,0 4.3705704,0.524541 6.28125,1.40625 L 0,-22.46875 z M 0,-12 c -6.6277282,0 -12,5.3732038 -12,12 0,6.6277279 5.3722719,12 12,12 C 6.6277282,12 12,6.6277279 12,0 12,-6.6267962 6.6277281,-12 0,-12 z m -0.0625,2 7.75,11.03125 -5.625,-2.5625 0,11.46875 C 1.3905,10.077306 0.71300966,10.15625 0,10.15625 c -0.76240772,0 -1.5038762,-0.09062 -2.21875,-0.25 l 0,-11.4375 L -7.6875,1.03125 -0.0625,-10 z',
                officer: 'm 34.957935,10.274357 -6.739258,9.488607 c 2.051,-0.946 4.331258,-1.475261 6.739258,-1.475261 2.407,0 4.65573,0.529261 6.70573,1.475261 l -6.70573,-9.488607 z m 0,11.265625 c -7.111,0 -12.875,5.764 -12.875,12.875001 0,7.111 5.764,12.875 12.875,12.875 7.111,0 12.875001,-5.764 12.875001,-12.875 0,-7.111001 -5.764001,-12.875001 -12.875001,-12.875001 z m -5.968099,3.788737 5.968099,5.968099 5.968099,-5.968099 c 1.24,0.816 2.302165,1.878165 3.118165,3.118164 l -6.001628,5.9681 6.001628,5.968099 c -0.816,1.24 -1.878165,2.302164 -3.118165,3.118164 l -5.968099,-5.968099 -5.968099,5.968099 c -1.239,-0.816 -2.302164,-1.880164 -3.118164,-3.118164 l 5.968099,-5.968099 -5.968099,-5.9681 c 0.816,-1.238 1.879164,-2.302164 3.118164,-3.118164 z',
                recon: 'm 34.663594,6.7554503 -6.739258,9.4886077 c 2.051,-0.946 4.331258,-1.475261 6.739258,-1.475261 2.407,0 4.689258,0.529261 6.739258,1.475261 L 34.663594,6.7554503 z m 0,11.2656257 c -7.111,0 -12.875,5.765 -12.875,12.875001 0,7.111 5.764,12.875 12.875,12.875 7.111,0 12.875001,-5.764 12.875001,-12.875 0,-7.110001 -5.764001,-12.875001 -12.875001,-12.875001 z m 5.263998,3.352865 c 1.781,0.989 3.270138,2.477138 4.258138,4.258138 L 29.399597,40.418212 c -1.781,-0.987999 -3.269138,-2.478138 -4.258139,-4.258138 L 39.927592,21.373941 z',
                virtual: 'm 34.353008,8.6649727 -6.70573,9.4886063 c 2.051,-0.946001 4.29773,-1.475261 6.70573,-1.475261 2.407,0 4.689258,0.52926 6.739258,1.475261 L 34.353008,8.6649727 z m 0,11.2656243 c -7.11,0 -12.875001,5.765 -12.875001,12.875 0,7.111 5.765001,12.875001 12.875001,12.875001 7.111,0 12.875,-5.764001 12.875,-12.875001 0,-7.11 -5.764,-12.875 -12.875,-12.875 z m 0,2.011719 c 6.007,0 10.89681,4.857281 10.89681,10.863281 0,6.008 -4.88981,10.863282 -10.89681,10.863282 -6.007,0 -10.863282,-4.855282 -10.863282,-10.863282 0,-6.006 4.856282,-10.863281 10.863282,-10.863281 z'
            };

        return function (val) {
            var
                side,
                sideUrlBit,
                classtype,
                classtypeUrlBit,
                vehicle,
                vehicleUrlBit,
                imageUrl;

            vehicle = (val.status && val.status.vehicle) || 'none';
            vehicleUrlBit = mapVehicle[vehicle] || vehicle;

            side = (val.role && val.role.side) || 'civ';
            sideUrlBit = mapSide[side] || side;

            classtype = (val.role && val.role.classtype) || 'unknown';

            if (vehicleUrlBit && vehicleUrlBit !== 'man') {
                classtypeUrlBit = '';
            } else {

                return {
                    path: paths[classtype] || paths.man,
                    fillColor: colors[side],
                    fillOpacity: val.status && val.status.condition === 'alive' ? 1 : 0.4,
                    scale: 0.5,
                    strokeColor: (val.status && val.status.condition === 'dead') ? colors.dead : colors[side],
                    rotation: (val.position && val.position.dir) || 0
                };
            }

            if (val.status && val.status.condition === 'dead') {
                sideUrlBit = 'dead';
                vehicleUrlBit = '';
                classtypeUrlBit = 'man';
            }

            imageUrl = 'images/' + sideUrlBit + '_icon' + vehicleUrlBit + classtypeUrlBit + '_ca.png';

            return {
                url: imageUrl,
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 6)
            };
        };
    }());

    function markerAction(methodName) {
        _.each(markers, function (m) {
            m.infowindow[methodName](currentMap, m);
        });
    }

    function clearMap() {
        _.each(markers, function (marker, idx) {
            marker.setMap(null);
            delete markers[idx];
        });
    }
    window.map = {
        init: init,
        updateMap: updateMap,
        clearMap: clearMap,
        showMarkers: function () {markerAction('open'); },
        hideMarkers: function () {markerAction('close'); },
        _getMap: function () {
            return currentMap;
        }

    };
}());
