var View = require('../../../core/view');

var GeometryViewBase = View.extend({
  initialize: function (options) {
    if (!options.model) throw new Error('model is required');
    if (!options.mapView) throw new Error('mapView is required');

    this.mapView = options.mapView;

    this.model.on('remove', this._onGeometryRemoved, this);
  },

  _onGeometryRemoved: function () {
    this.clean();
  }
});

module.exports = GeometryViewBase;
