var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var VisMetadataModel = require('builder/data/vis-metadata-model');
var template = require('./dataset-metadata.tpl');
var FooterView = require('./footer/footer-view');
var templateError = require('./dataset-metadata-error.tpl');
var templateLoading = require('builder/components/loading/render-loading');
var FormView = require('./form/form-view');
var saveMetadata = require('./save-metadata-dataset');
var errorParser = require('builder/helpers/error-parser');
var Notifier = require('builder/components/notifier/notifier');
var utils = require('builder/helpers/utils');

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onBackFromError'
  },

  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.modalModel) throw new TypeError('modalModel is required');
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');
    if (!opts.configModel) throw new TypeError('configModel is required');
    if (opts.isLocked === undefined) throw new TypeError('isLocked is required');

    this._modalModel = opts.modalModel;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._configModel = opts.configModel;
    this._isLocked = opts.isLocked;

    this._visMetadataModel = new VisMetadataModel({
      name: this._visDefinitionModel.get('name'),
      description: this._visDefinitionModel.get('description'),
      license: this._visDefinitionModel.get('license'),
      source: this._visDefinitionModel.get('source'),
      attributions: this._visDefinitionModel.get('attributions'),
      tags: this._visDefinitionModel.get('tags')
    });

    this._stateModel = new Backbone.Model({
      status: 'show'
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    if (this._hasError()) {
      this._renderError();
    } else if (this._isLoading()) {
      this._renderLoading();
    } else {
      this.$el.html(template());
      this._initViews();
    }
    return this;
  },

  _initViews: function () {
    var formView = new FormView({
      visDefinitionModel: this._visDefinitionModel,
      visMetadataModel: this._visMetadataModel,
      configModel: this._configModel,
      isLocked: this._isLocked
    });

    this.$('.js-content').append(formView.render().el);
    this.addView(formView);

    var footerView = new FooterView({
      visMetadataModel: this._visMetadataModel,
      onSaveAction: this._onSave.bind(this),
      onCloseAction: this._onClose.bind(this)
    });

    this.$('.js-footer').append(footerView.render().el);
    this.addView(footerView);
  },

  _renderError: function () {
    var error = this._stateModel.get('error');
    this.$el.html(templateError({
      error: _t('components.modals.dataset-metadata.error.subtitle', {error: error})
    }));
  },

  _renderLoading: function () {
    this.$el.html(
      templateLoading({
        title: _t('components.modals.dataset-metadata.loading')
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
    this._stateModel.set({status: 'loading'});

    saveMetadata({
      onSuccess: this._onSuccessSave.bind(this),
      onError: this._onErrorSave.bind(this),
      visDefinitionModel: this._visDefinitionModel,
      name: this._getMetadataName(),
      description: this._getMetadataDescription(),
      tags: this._getMetadataTags(),
      source: this._visMetadataModel.get('source'),
      attributions: this._visMetadataModel.get('attributions'),
      license: this._visMetadataModel.get('license')
    });
  },

  _onSuccessSave: function () {
    var self = this;
    Notifier.addNotification({
      status: 'success',
      info: _t('components.modals.dataset-metadata.success', {
        name: self._getMetadataName()
      }),
      closable: true,
      delay: Notifier.DEFAULT_DELAY
    });

    this._modalModel.destroy();
  },

  _onClose: function () {
    this._modalModel.destroy();
  },

  _onErrorSave: function (e) {
    this._stateModel.set({
      status: 'error',
      error: errorParser(e)
    });
  },

  _onBackFromError: function () {
    this._stateModel.set({status: 'show'});
  },

  _getMetadataName: function () {
    return utils.sanitizeHtml(this._visMetadataModel.get('name'));
  },

  _getMetadataDescription: function () {
    return utils.sanitizeHtml(this._visMetadataModel.get('description'));
  },

  _getMetadataTags: function () {
    return _.map(this._visMetadataModel.get('tags'), function (tag) {
      return utils.sanitizeHtml(tag);
    });
  }
});
