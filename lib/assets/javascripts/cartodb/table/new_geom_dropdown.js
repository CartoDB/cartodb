/**
 * view for dropdown show when user click on row options
 */
cdb.admin.NewGeometryDropdown = cdb.admin.DropdownMenu.extend({

  className: 'dropdown border',

  events: {
    'click .line': 'newLine',
    'click .point': 'newPoint',
    'click .polygon': 'newPolygon'
  },

  _trigger: function(e, t) {
    this.killEvent(e);
    this.trigger('newGeometry', t);
    this.hide();
  },

  newPolygon: function(e) {
    this._trigger(e, 'polygon')
  },

  newLine: function(e) {
    this._trigger(e, 'line')
  },

  newPoint: function(e) {
    this._trigger(e, 'point')
  }


});
