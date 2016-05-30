var cdb = require('cartodb.js');
var ColorPicker = require('../color-picker/color-picker');
var template = require('./input-color-picker-view.tpl');
var InputColorPickerHeader = require('./input-color-picker-header');

module.exports = cdb.core.View.extend({
  defaults: {
    index: 0,
    isCustomizable: false
  },

  events: {
    'click .js-back': '_onClickBack',
    'click .js-color': '_onClickColor'
  },

  initialize: function (opts) {
    if (!opts.ramp) throw new Error('ramp param is required');

    this.model = new cdb.core.Model({
      index: this.options.index,
      ramp: opts.ramp
    });

    this.model.bind('change:index', this._onChangeIndex, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._headerView = new InputColorPickerHeader({
      model: this.model
    });

    this._colorPicker = new ColorPicker({
      value: this._getColor(),
      opacity: 1 // TODO: replace with real opacity
    });

    this._colorPicker.bind('change', this._onChangeValue, this);

    this.$el.append(template());

    this.$('.js-header').append(this._headerView.render().$el);
    this.$('.js-content').append(this._colorPicker.render().$el);

    // TODO: add add_view

    return this;
  },

  _setColor: function (color) {
    var ramp = this.model.get('ramp');
    ramp[this.model.get('index')].color = color;
    this.model.set('ramp', ramp);
    this.model.trigger('change', ramp);

    this.trigger('change', ramp);
  },

  _getColor: function () {
    var ramp = this.model.get('ramp');
    return ramp[this.model.get('index')].color;
  },

  _onChangeIndex: function () {
    this._colorPicker.setColor(this._getColor());
  },

  _onChangeValue: function (color) {
    this._setColor(color.hex);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  }
});
