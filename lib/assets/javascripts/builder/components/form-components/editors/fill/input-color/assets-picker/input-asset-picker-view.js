var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./input-asset-picker-view.tpl');
var InputAssetPickerHeader = require('./input-asset-picker-header');
var InputAssetPickerView = require('builder/components/form-components/editors/fill/input-color/input-color-file-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var REQUIRED_OPTS = [
  'configModel',
  'modals',
  'ramp',
  'userModel'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._imageEnabled = opts.imageEnabled;

    this.model = new Backbone.Model({
      index: this.options.index,
      ramp: opts.ramp
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._headerView = new InputAssetPickerHeader({
      model: this.model,
      imageEnabled: this._imageEnabled
    });
    this._headerView.bind('goToColorPicker', this._onGoToColorPicker, this);
    this._headerView.bind('back', this._onClickBack, this);
    this.$('.js-header').append(this._headerView.render().el);
    this.addView(this._headerView);

    this._assetPicker = new InputAssetPickerView({
      model: this.model,
      userModel: this._userModel,
      configModel: this._configModel,
      modals: this._modals,
      imageEnabled: this._imageEnabled
    });
    this._assetPicker.bind('change', _.debounce(this._onChangeImage, 50), this);
    this.$('.js-content').append(this._assetPicker.render().el);
    this.addView(this._assetPicker);
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

  _onChangeImage: function (data) {
    var url = data && data.url || '';
    var kind = data && data.kind || '';

    this._getRampItem().image = url;
    this.model.trigger('change:image');

    this.trigger('change:image', {
      url: url,
      kind: kind,
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
