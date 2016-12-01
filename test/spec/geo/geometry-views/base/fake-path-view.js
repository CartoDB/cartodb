var FakePointView = require('./fake-point-view');
var Path = require('./fake-path');
var PathViewBase = require('../../../../../src/geo/geometry-views/base/path-view-base.js');

var PathView = PathViewBase.extend({
  PointViewClass: FakePointView,

  _createGeometry: function () {
    return new Path({
      latlngs: this.model.getCoordinates()
    });
  }
});

module.exports = PathView;
