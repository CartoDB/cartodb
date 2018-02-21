var CoreView = require('backbone/core-view');
var template = require('./input-asset-picker-header.tpl');
var ImageLoaderView = require('builder/components/img-loader-view');

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-colorPicker': '_onClickColorPicker'
  },

  initialize: function (opts) {
    this._imageEnabled = opts.imageEnabled;

    this._initBinds();
  },

  render: function (model, options) {
    this.clearSubViews();
    this.$el.empty();

    var rampItem = this._getRampItem();

    this.$el.append(template({
      index: this.model.get('index') || 0,
      color: rampItem.color || '',
      label: rampItem.title || _t('form-components.editors.fill.input-qualitative-ramps.others'),
      image: rampItem.image || '',
      imageEnabled: this._imageEnabled
    }));

    this._loadImages();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:image', this.render);
  },

  _getRampItem: function () {
    var ramp = this.model.get('ramp');

    if (!ramp) {
      return {
        color: '',
        title: _t('form-components.editors.fill.input-qualitative-ramps.others'),
        image: ''
      };
    }

    return ramp[this.model.get('index')];
  },

  _loadImages: function () {
    var rampItem = this._getRampItem();

    this.iconView = new ImageLoaderView({
      imageClass: 'CDB-Text u-actionTextColor js-assetPicker',
      imageUrl: rampItem.image,
      color: rampItem.color
    });
    this.addView(this.iconView);
    this.$('.js-image-container').append(this.iconView.render().el);
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
