var Marker = require('./fake-marker');
var PointViewBase = require('../../../../../src/geo/geometry-views/base/point-view-base.js');

var PointView = PointViewBase.extend({
  _createMarker: function () {
    return new Marker({
      latlng: this.model.getCoordinates(),
      isDraggable: this.model.isEditable(),
      iconURL: this.model.get('iconUrl')
    });
  },

  _updateMarkersIcon: function () {
    this._marker.setIconURL(this.model.get('iconUrl'));
  },

  _bindMarkerEvents: function () {
    this._marker.on('dragstart', this._onDragStart);
    this._marker.on('drag', this._onDrag);
    this._marker.on('dragend', this._onDragEnd);
    this._marker.on('mousedown', this._onMouseDown);
    this._marker.on('click', this._onMouseClick);
  },

  _unbindMarkerEvents: function () {
    this._marker.off('dragstart', this._onDragStart);
    this._marker.off('drag', this._onDrag);
    this._marker.off('dragend', this._onDragEnd);
    this._marker.off('mousedown', this._onMouseDown);
    this._marker.off('click', this._onMouseClick);
  }
});

module.exports = PointView;
