
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

    var moveMarkerSmoothlyInOneSecond = (function () {
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
                targetTime = 1000,
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
        if (oldIcon && oldIcon.url === newIcon.url) {
            return;
        }
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
                moveMarkerSmoothlyInOneSecond(m, gameCoordsToLatLng(val.position.x, val.position.y));
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

    function getIcon(val) {
        var
            mapSide = {
                'ind': 'independent',
                'civ': 'civilian'
            },
            side,
            sidePrefix,
            mapClasstype = {
                'unknown': ''
            },
            classtype,
            classtypeUrlBit,
            imageUrl;

        side = (val.role && val.role.side) || 'civ';
        sidePrefix = mapSide[side] || side;

        classtype = (val.role && val.role.classtype) || 'unknown';
        classtypeUrlBit = mapClasstype[classtype] || classtype;

        imageUrl = 'images/' + sidePrefix + '_iconman' + classtypeUrlBit + '_ca.png';

        return {
            url: imageUrl,
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 6)
        };
    }

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
