var CoreView = require('backbone/core-view');
var template = require('./input-asset-picker-header.tpl');

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-colorPicker': '_onClickColorPicker'
  },

  initialize: function (opts) {
    this._initBinds();
  },

  render: function (model, options) {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      index: this.model.get('index'),
      color: this._getColor().val,
      label: this._getColor().title || _t('form-components.editors.fill.input-categories.others'),
      image: this.model.get('image')
    }));

    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
  },

  _getColor: function () {
    var ramp = this.model.get('ramp');
    return ramp[this.model.get('index')];
  },

  _onClickBack: function (ev) {
    this.killEvent(ev);
    this.trigger('back', this);
  },

  _onClickColorPicker: function (ev) {
    this.killEvent(ev);
    this.trigger('goToColorPicker', this);
  }
});
