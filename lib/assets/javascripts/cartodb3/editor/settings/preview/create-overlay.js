var createZoomOverlay = function (collection) {
  var options = {
    type: 'zoom',
    order: 6,
    display: true,
    x: 20,
    y: 20
  };
  collection.add(options);
};

var createLogoOverlay = function (collection) {
  var options = {
    type: 'logo',
    order: 10,
    display: true,
    x: 10,
    y: 40
  };
  collection.add(options);
};

var createSearchOverlay = function (collection) {
  var options = {
    type: 'search',
    order: 3,
    display: true,
    x: 60,
    y: 20
  };
  collection.add(options);
};

var createLayerSelectorOverlay = function (collection) {
  var options = {
    type: 'layer_selector',
    order: 4,
    display: true,
    x: 212,
    y: 20
  };

  collection.add(options);
};

var createFullScreenOverlay = function (collection) {
  var options = {
    type: 'fullscreen',
    order: 7,
    display: true,
    x: 20,
    y: 172
  };
  this.add(options);
};

module.exports = function (overlayCollection, overlayType) {
  var types = {
    'fullscreen': createFullScreenOverlay,
    'layer_selector': createLayerSelectorOverlay,
    'search': createSearchOverlay,
    'zoom': createZoomOverlay,
    'logo': createLogoOverlay
  };
  var fn = types[overlayType];
  fn && fn.call(this, overlayCollection);
};
