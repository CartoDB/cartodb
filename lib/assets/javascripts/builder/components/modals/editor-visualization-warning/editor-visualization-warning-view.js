var CoreView = require('backbone/core-view');
var template = require('./editor-visualization-warning.tpl');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var renderLoading = require('builder/components/loading/render-loading');
var ErrorView = require('builder/components/error/error-view');
var errorParser = require('builder/helpers/error-parser');
var VIS_VERSION = 3;

/**
 *  Confirmation modal dialog
 */

module.exports = CoreView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-open': '_onOpen',
    'click .js-duplicate': '_onDuplicate',
    'click .js-cancel': '_onCancel'
  },

  initialize: function (opts) {
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.modalModel) throw new Error('modalModel is required');

    this._visDefinitionModel = opts.visDefinitionModel;
    this._modalModel = opts.modalModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());
    return this;
  },

  _initBinds: function () {
    this._modalModel.bind('change:show', this._goToDashboard, this);
    this.add_related_model(this._modalModel);
  },

  _disableBinds: function () {
    this._modalModel.unbind('change:show', this._goToDashboard, this);
  },

  _onOpen: function () {
    this._disableBinds();
    this._renderLoading('open');

    this._visDefinitionModel.save({
      version: VIS_VERSION
    }, {
      wait: true,
      success: function () {
        this._modalModel.destroy();
      }.bind(this),
      error: function (mdl, e) {
        this._renderError(errorParser(e));
      }.bind(this)
    });
  },

  _onDuplicate: function () {
    this._renderLoading('duplicate');

    var newVisModel = new VisDefinitionModel({
      name: this._visDefinitionModel.get('name')
    }, {
      configModel: this._visDefinitionModel._configModel
    });

    newVisModel.save({
      source_visualization_id: this._visDefinitionModel.get('id')
    }, {
      success: function (visModel) {
        this._redirectToBuilder(visModel.builderURL());
      }.bind(this),
      error: function (mdl, e) {
        this._renderError(errorParser(e));
      }.bind(this)
    });
  },

  _redirectToBuilder: function (redirect) {
    window.location = redirect;
  },

  _renderLoading: function (renderOption) {
    var mapName = this._visDefinitionModel.get('name');
    var titleText = '';

    if (renderOption === 'duplicate') {
      titleText = _t('editor.maps.duplicate.loading', { name: mapName });
    } else if (renderOption === 'open') {
      titleText = _t('components.modals.editor-vis-warning.opening-title', { name: mapName });
    }

    this.$el.html(
      renderLoading({
        title: titleText
      })
    );
  },

  _renderError: function (errorMessage) {
    var mapName = this._visDefinitionModel.get('name');
    var errorView = new ErrorView({
      title: _t('editor.maps.duplicate.error', { name: mapName }),
      desc: errorMessage
    });
    this.$el.html(errorView.render().el);
    this.addView(errorView);
  },

  _goToDashboard: function (redirect) {
    window.location = redirect;
  },

  _onCancel: function () {
    this._goToDashboard(this._visDefinitionModel._configModel.get('base_url'));
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.apply(this);
  }

});
