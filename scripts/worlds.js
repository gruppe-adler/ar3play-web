
var worlds = {
    stratis: {
        tileDir: 'stratis_18022',
        initialZoom: 7,
        maxZoom: 14,
        center: [5000, 5000],
        metersToCoord: function (x, y) {
            return new google.maps.LatLng(y * 0.00018861 - 2.8114, x * 0.00018882);
        },
        coordToMeters: function (latLng) {
            return {
                x: latLng.lat() / 0.00018882,
                y: latLng.lng() + 2.8114 / 0.00018861,
                z: 0
            };
        },
        name: 'Stratis'
    },

    altis: {
        tileDir: 'AltisZL5',
        initialZoom: 7,
        maxZoom: 14,
        center: [15000, 15000],
        metersToCoord: function (x, y) {
            return new google.maps.LatLng(y * 0.00018870 - 3.2900, x * 0.0001888 - 0.0059);
        },
        coordToMeters: function (latLng) {
            return {
                x: latLng.lat() / 0.0001828,
                y: latLng.lng() + 2.8114 / 0.00018861,
                z: 0
            };
        },
        name: 'Altis'
    },

    chernarus: {
        tileDir: 'Chernarus_33792',
        initialZoom: 7,
        maxZoom: 14,
        center: [6000, 6000],
        metersToCoord: function (x, y) {
            return new google.maps.LatLng(y * 0.00009435 - 2.8114, x * 0.00009432);
        },
        coordToMeters: function (latLng) {
            return {
                x: latLng.lat() / 0.00009432,
                y: latLng.lng() + 2.8114 / 0.00009435,
                z: 0
            };
        },
        name: 'Chernarus'
    },

    takistan: {
        tileDir: 'Takistan_28384',
        initialZoom: 7,
        maxZoom: 14,
        center: [6000, 6000],
        metersToCoord: function (x, y) {
            return new google.maps.LatLng(y * 0.00019015 - 2.8114, x * 0.0001903);
        },
        coordToMeters: function (latLng) {
            return {
                x: latLng.lat() / 0.0001903,
                y: latLng.lng() + 2.8114 / 0.00018980,
                z: 0
            };
        },
        name: 'Takistan'
    },

    // dummy data
    fata: {
        center: [5000, 5000],
        metersToCoord: function (x, y) {
            return new google.maps.LatLng(y * 0.00009435 - 2.8114, x * 0.00009432);
        },
        tileDir: 'dummy',
        initialZoom: 7,
        minZoom: 7,
        maxZoom: 14,
        name: 'PR FATA (dummy)'
    },
    kunduz: {
        center: [2000, 2000],
        metersToCoord: function (x, y) {
            return new google.maps.LatLng(y * 0.00009435 - 2.8114, x * 0.00009432);
        },
        tileDir: 'dummy',
        initialZoom: 7,
        minZoom: 7,
        maxZoom: 14,
        name: 'PR Kunduz (dummy)'
    }
};

worlds.chernarus_summer = worlds.chernarus;
