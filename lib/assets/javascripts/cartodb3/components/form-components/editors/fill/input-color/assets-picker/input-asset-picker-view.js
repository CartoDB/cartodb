var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./input-asset-picker-view.tpl');
var InputAssetPickerHeader = require('./input-asset-picker-header');

module.exports = CoreView.extend({
  events: {
  },

  initialize: function (opts) {
    if (!opts || !opts.ramp) throw new Error('ramp param is required');

    this.model = new Backbone.Model({
      index: this.options.index,
      ramp: opts.ramp
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._headerView = new InputAssetPickerHeader({
      model: this.model
    });
    this._headerView.bind('goToColorPicker', this._onGoToColorPicker, this);
    this._headerView.bind('back', this._onClickBack, this);
    this.addView(this._headerView);
    //
    // this._assetPicker = new AssetPicker({
    //   value: this._getColor(),
    //   opacity: 1,
    //   disableOpacity: true
    // });

    // this.addView(this._colorPicker);

    // this._colorPicker.bind('change', this._onChangeValue, this);

    this.$el.append(template());

    this.$('.js-header').append(this._headerView.render().$el);
    // this.$('.js-content').append(this._colorPicker.render().$el);

    return this;
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
