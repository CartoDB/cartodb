var _ = require('underscore');
var Backbone = require('backbone');
var GeometryBase = require('./geometry-base');

var MultiPathBase = GeometryBase.extend({
  initialize: function (attrs, options) {
    if (!this.PathClass) throw new Error('Subclasses of MultiPathBase must declare a PathClass instance variable');

    GeometryBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    var paths = [];
    if (options.latlngs) {
      paths = _.map(options.latlngs, this._createPath, this);
    }
    this.paths = new Backbone.Collection(paths);
  },

  isComplete: function () {
    return this.paths.all(function (path) {
      return path.isComplete();
    });
  },

  getLatLngs: function () {
    return this.paths.map(function (path) {
      return path.getLatLngs();
    });
  },

  update: function (latlng) {},

  isEditable: function () {
    return !!this.get('editable');
  },

  _createPath: function (latlngs) {
    var pathAttrs = {};
    if (this.isEditable()) {
      pathAttrs = {
        editable: true
      };
    }
    return new this.PathClass(pathAttrs, { latlngs: latlngs });
  }
});

module.exports = MultiPathBase;
