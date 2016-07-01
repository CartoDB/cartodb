var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var VisMetadataModel = require('./vis-metadata-model');
var template = require('./map-metadata.tpl');
var FooterView = require('./footer/footer-view');
var templateError = require('./map-metadata-error.tpl');
var templateLoading = require('../../loading/render-loading');

/**
 * Add layer dialog, typically used from editor
 */
module.exports = CoreView.extend({

  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.modalModel) throw new TypeError('modalModel is required');
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');

    this._modalModel = opts.modalModel;
    this._visDefinitionModel = opts.visDefinitionModel;

    this._visMetadataModel = new VisMetadataModel({}, {
      visDefinitionModel: this._visDefinitionModel
    });

    this._stateModel = new Backbone.Model({
      status: 'show'
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this._renderError();

    // if (this._hasError()) {
    //   this._renderError();
    // } else if (this._isLoading()) {
    //   this._renderLoading();
    // } else {
    //   this._initViews();
    // }
  },

  _initViews: function () {
    this.$el.html(template());

    var footerView = new FooterView({
      visMetadataModel: this._visMetadataModel,
      onSaveAction: this._onSave.bind(this)
    });

    this.addView(footerView);
    this.$('.js-footer').append(footerView.render().el);
  },

  _renderError: function () {
    this.$el.html(templateError());
  },

  _renderLoading: function () {
    this.$el.html(
      templateLoading({
        title: _t('components.modals.maps-metadata.loading')
      })
    );
  },

  _initBinds: function () {
    this._stateModel.on('change:status', this.render, this);
    this.add_related_model(this._stateModel);
  },

  _hasError: function () {
    return this._stateModel.get('status') === 'error';
  },

  _isLoading: function () {
    return this._stateModel.get('status') === 'loading';
  },

  _onSave: function () {
    console.log('onSave');
  }
});
