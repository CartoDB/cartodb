/**
 *  Maps list.
 *
 */

var cdb = require('cartodb.js');
var MapsItem = require('new_dashboard/maps/maps_item');


module.exports = cdb.core.View.extend({

  className: 'Maps-list',
  tagName: 'ul',

  events: {},

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.collection.each(this._addMap, this);

    return this;
  },

  _addMap: function(m, i) {
    var item = new MapsItem({
      model: m,
      user: this.user,
      router: this.router
    })
    this.addView(item);
    this.$el.append(item.render().el);
  },

  _removeMap: function() {

  },

  _initBinds: function() {
    this.router.model.on('change', this._onRouteChange, this);
  },

  _onRouteChange: function(m, c) {
    if (c.changes.content_type && m.get('content_type') === "maps") {
      this._enableBinds();
    } else if (m.get('content_type') !== "maps") {
      this._disableBinds();
    }
  },

  _enableBinds: function() {
    this.collection.on('reset', this.render, this);
  },

  _disableBinds: function() {
    this.collection.off('reset', this.render, this);
  }

})
