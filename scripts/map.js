
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
                    return worlds[currentWorld] || {
                            minZoom: 7,
                            maxZoom: 14
                        };
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

        // dont check for changes on svg icons - yet
        marker.setIcon(newIcon);
    }


    function updateMap(data) {
        _.each(data, function (val, id) {
            var m = markers[id] || new google.maps.Marker({
                    position: { lat: 0, lng: 0 },
                    map: currentMap,
                    title: '' + (val.name || val.id)
                });

            if (val.position) {
                moveMarkerSmoothlyInTwoSeconds(m, gameCoordsToLatLng(val.position[0], val.position[1]));
                //m.zIndex = 1000 + (val.position[2] || 0);
                //m.setPosition(gameCoordsToLatLng(val.position.x, val.position.y));
            }

            setIconIfChanged(m, getIcon(val));
            m.infowindow = m.infowindow || new google.maps.InfoWindow({
                content: '?'
            });
            m.infowindow.content = '<div>' + id + '</div>';
            markers[id] = m;
        });
    }

    getIcon = (function () {
        var
            colors = {
                WEST: '#004c9a',
                EAST: '#800000',
                GUER: '#008001',
                CIV: '#660080',
                EMPTY: '#808000',
                dead: '#333333',
                ENEMY: '#ff2200',
                AMBIENT_LIFE: '#000000',
                UNKNOWN: '#ffff00'
            };

        return function (val) {
            var
                side,
                color,
                vehicle,
                opacity,
                dir,
                path;

            dir = val.direction || 0;

            vehicle = val.container;
            if (vehicle) {
                path = ''
            } else {
                path = iconToPath(val.icon);
            }

            side = val.side || 'CIV';
            color = val.health === 'dead' ? colors.dead : colors[side];
            opacity = val.health === 'alive' ? 1 : 0.4;

            return {
                path: path,
                fillColor: color,
                fillOpacity: opacity,
                scale: val.container ? 0 : 0.5,
                strokeColor: color,
                rotation: dir
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
