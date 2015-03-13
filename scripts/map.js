/*global google, $, _ */
/*
* Ursprung: (links unten): {lat: -2.8115, lng: -0}
* 1km lat === 0.188 ===>
* 1km lng === 0.189
*/
(function () {

    var initialZoom = 7;
    var tileSize = 256;
    var map;
    var markers = {};

    function isOutOfBounds(x, y, numTiles) {
        if (y < 0 || y >= numTiles) {
            return true;
        }
        if (x < 0 || x >= numTiles) {
            return true;
        }
    }
    var armaMapType = new google.maps.ImageMapType({
        getTileUrl: function (coord, zoom) {
            var x = coord.x;
            var y = coord.y;
            var numTiles = Math.pow(2, zoom - 1);
            var tileZoom = zoom - initialZoom;
            x = x - numTiles;
            y = y - numTiles;
            if (isOutOfBounds(x, y, numTiles)) {
                return null;
            }
            var myY = Math.pow(2, tileZoom) - (y + 1);
            var baseURL = 'maptiles/stratis_18022/';
            baseURL += [tileZoom, x, myY].join('/') + '.png';
            return baseURL;
        },
        tileSize: new google.maps.Size(tileSize, tileSize),
        isPng: true,
        minZoom: initialZoom + 2,
        maxZoom: initialZoom + 7,
        name: 'Stratis T10'
    });
    function init() {
        map = new google.maps.Map(document.querySelector('#map'), {
            zoom: 7,
            center: new google.maps.LatLng(0, 0),
            mapTypeControlOptions: {
                mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'armaMapType']
            }
        });
        map.mapTypes.set('map', armaMapType);
        map.setMapTypeId('map');

    }
    google.maps.event.addDomListener(window, 'load', init);
    /**
     * in-game coordinates are in meters, with 0,0 at south west corner of map
     * @param x
     * @param y
     *
     * For simplicity's sake, I will translate
     *
     */
    function gameCoordsToLatLng(x, y) {
        return new google.maps.LatLng(y * 0.000189 + +-2.8115, x * 0.000188);
    }
    function latLngToGameCoords(latLng) {
        return {
            x: latLng.lat() / 0.000188,
            y: latLng.lng() + 2.8115 / 0.000189,
            z: 0
        };
    }

    function updateMap(data) {
        _.each(data, function (val, name) {
            var m = markers[name] || new google.maps.Marker({
                    position: { lat: 0, lng: 0 },
                    map: map,
                    title: name
                });
            m.setPosition(gameCoordsToLatLng(val.position.x, val.position.y));
            m.setIcon('images/player-' + (val.side || 'unknown') + '.png');
            m.infowindow = m.infowindow || new google.maps.InfoWindow({
                content: '?'
            });
            m.infowindow.content = '<div>' + name + '</div>';
            markers[name] = m;
        });
    }

    function markerAction(methodName) {
        _.each(markers, function (m) {
            m.infowindow[methodName](map, m);
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
        hideMarkers: function () {markerAction('close'); }
    };
}());
