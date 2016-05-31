var cdb = require('cartodb.js');
var ColorPicker = require('../color-picker/color-picker');
var template = require('./input-color-picker-view.tpl');
var InputColorPickerHeader = require('./input-color-picker-header');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.ramp) throw new Error('ramp param is required');

    this.model = new cdb.core.Model({
      index: this.options.index,
      ramp: opts.ramp
    });

    this.model.bind('change:index', this._onChangeIndex, this);
    this.model.bind('change:ramp', this.render, this);
  },

  ramp: function (ramp) {
    console.log(1, ramp);
    ramp = _.map(this.model.get('ramp'), function (c, i) {
      return { title: ramp[i], color: c.color }
    }, this);
    console.log(ramp);
    this.model.set('ramp', ramp);
    //this.model.trigger('change:ramp', ramp);
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
    return ramp[this.model.get('index') || 0].color;
  },

  _onChangeIndex: function () {
    this._colorPicker.setColor(this._getColor());
    this.trigger('changeIndex', this.model.get('index'), this);
  },

  _onChangeValue: function (color) {
    this._setColor(color.hex);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  }
});
