var template = require('./input-asset-picker-header.tpl');
var ImageLoaderView = require('../../../../../img-loader-view');

module.exports = ImageLoaderView.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-colorPicker': '_onClickColorPicker'
  },

  initialize: function (opts) {
    this._initBinds();

    ImageLoaderView.prototype.initialize.call(this, {
      imageClass: 'CDB-Text u-actionTextColor js-assetPicker'
    });
  },

  render: function (model, options) {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      index: this.model.get('index'),
      color: this._getRampItem().color,
      label: this._getRampItem().title || _t('form-components.editors.fill.input-categories.others'),
      image: this._getRampItem().image
    }));

    this._loadImage(this._getRampItem().image, this._getRampItem().color);

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:image', this.render, this);
  },

  _getRampItem: function () {
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
