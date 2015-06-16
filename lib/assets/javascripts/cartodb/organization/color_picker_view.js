var $ = require('jquery');
var cdb = require('cartodb.js');

/**
 *  Color picker for organization brand color
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click': '_openPicker'
  },

  initialize: function() {
    this.$input = this.options._input;
    this.model = new cdb.core.Model({ color: this.options.color });
  },

  _createPicker: function() {
    var self = this;

    this.colorPicker = new cdb.admin.ColorPicker({
      className: 'dropdown color_picker border',
      target: this.$el,
      vertical_position: "up",
      horizontal_position: "left",
      vertical_offset: 5,
      horizontal_offset: 17,
      tick: "left",
      dragUpdate: true
    }).bind("colorChosen", this._setColor, this);

    this._bindPicker();
    this.addView(this.colorPicker);
  },

  _openPicker: function(e) {
    this.killEvent(e);
    
    if (this.colorPicker) {
      this._destroyPicker();
      return false;
    }

    if (!this.colorPicker) {
      this._createPicker();
      $('body').append(this.colorPicker.render().el);
      this.colorPicker.init(this.model.get('color'));
    }
  },

  _destroyPicker: function() {
    if (this.colorPicker) {
      this._unbindPicker();
      this.removeView(this.colorPicker);
      this.colorPicker.hide();
      delete this.colorPicker;
    }
  },

  _bindPicker: function() {
    cdb.god.bind("closeDialogs", this._destroyPicker, this);
  },

  _unbindPicker: function() {
    cdb.god.unbind("closeDialogs", this._destroyPicker, this);
  },

  _setColor: function(color, close) {
    if (color) {
      this.$el.css('background-color', color);
      this.$input.val(color);  
    }
    if (close) {
      this._destroyPicker();
    }
  },

  clean: function() {
    this._destroyPicker();
    this.elder('clean');
  }

})