var DEFAULT_MAP_STYLE = [{
    stylers: [{
        saturation: -65
    }, {
        gamma: 1.52
    }]
}, {
    featureType: "administrative",
    stylers: [{
        saturation: -95
    }, {
        gamma: 2.26
    }]
}, {
    featureType: "water",
    elementType: "labels",
    stylers: [{
        visibility: "off"
    }]
}, {
    featureType: "administrative.locality",
    stylers: [{
        visibility: "off"
    }]
}, {
    featureType: "road",
    stylers: [{
        visibility: "simplified"
    }, {
        saturation: -99
    }, {
        gamma: 2.22
    }]
}, {
    featureType: "poi",
    elementType: "labels",
    stylers: [{
        visibility: "off"
    }]
}, {
    featureType: "road.arterial",
    stylers: [{
        visibility: "off"
    }]
}, {
    featureType: "road.local",
    elementType: "labels",
    stylers: [{
        visibility: "off"
    }]
}, {
    featureType: "transit",
    stylers: [{
        visibility: "off"
    }]
}, {
    featureType: "road",
    elementType: "labels",
    stylers: [{
        visibility: "off"
    }]
}, {
    featureType: "poi",
    stylers: [{
        saturation: -55
    }]
}];

module.exports = DEFAULT_MAP_STYLE;
