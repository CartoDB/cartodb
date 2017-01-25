var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./input-asset-picker-view.tpl');
var InputAssetPickerHeader = require('./input-asset-picker-header');
var InputAssetPickerView = require('../input-color-file-view');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts || !opts.ramp) throw new Error('ramp param is required');
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.userModel) throw new Error('userModel param is required');
    if (!opts.modals) throw new Error('modals param is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._modals = opts.modals;

    this.model = new Backbone.Model({
      index: this.options.index,
      ramp: opts.ramp
    });
  },

  _initViews: function () {
    this._headerView = new InputAssetPickerHeader({
      model: this.model
    });
    this.addView(this._headerView);

    this._assetPicker = new InputAssetPickerView({
      model: this.model,
      userModel: this._userModel,
      configModel: this._configModel,
      modals: this._modals
    });
    this.addView(this._assetPicker);
  },

  _initBinds: function () {
    this._headerView.bind('goToColorPicker', this._onGoToColorPicker, this);
    this._headerView.bind('back', this._onClickBack, this);

    this._assetPicker.bind('change', _.debounce(this._onChangeImage, 50), this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    this._initBinds();

    this.$('.js-header').append(this._headerView.render().$el);
    this.$('.js-content').append(this._assetPicker.render().$el);

    return this;
  },

  _getRampItem: function () {
    var ramp = this.model.get('ramp');

    if (!ramp) {
      return {
        color: '',
        title: _t('form-components.editors.fill.input-categories.others'),
        image: ''
      };
    }

    return ramp[this.model.get('index')];
  },

  _onChangeImage: function (url) {
    this._getRampItem().image = url || '';

    this.model.trigger('change:image');
    this.trigger('change:image', {
      image: this._getRampItem().image,
      index: this.model.get('index')
    }, this);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _onGoToColorPicker: function (e) {
    this.killEvent(e);
    this.trigger('goToColorPicker', this);
  }
});
