var CoreView = require('backbone/core-view');
var template = require('./editor-visualization-warning.tpl');
var VisDefinitionModel = require('../../../data/vis-definition-model');
var renderLoading = require('../../loading/render-loading');
var ErrorView = require('../../error/error-view');
var errorParser = require('../../../helpers/error-parser');

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
    if (!opts.visualizationData) throw new Error('visualizationData is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._visualizationData = opts.visualizationData;
    this._configModel = opts.configModel;
    this._modalModel = opts.modalModel;
    this._modals = opts.modals;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());
    return this;
  },

  _initBinds: function () {
    this._modalModel.bind('change:show', this._onCancel, this);
    this.add_related_model(this._modalModel);
  },

  _disableBinds: function () {
    this._modalModel.unbind('change:show', this._onCancel, this);
  },

  _onOpen: function () {
    this._disableBinds();
    this._modalModel.destroy();
  },

  _onDuplicate: function () {
    var self = this;

    this._renderLoading();

    var newVisModel = new VisDefinitionModel({
      name: this._visualizationData.name
    }, {
      configModel: this._configModel
    });

    newVisModel.save({
      source_visualization_id: self._visualizationData.id
    }, {
      success: function (visModel) {
        window.location = visModel.builderURL();
      },
      error: function (mdl, e) {
        self._renderError(errorParser(e));
      }
    });
  },

  _renderLoading: function () {
    var mapName = this._visualizationData.name;
    this.$el.html(
      renderLoading({
        title: _t('editor.maps.duplicate.loading', { name: mapName })
      })
    );
  },

  _renderError: function (errorMessage) {
    var mapName = this._visualizationData.name;
    var errorView = new ErrorView({
      title: _t('editor.maps.duplicate.error', { name: mapName }),
      desc: errorMessage
    });
    this.$el.html(errorView.render().el);
    this.addView(errorView);
  },

  _onCancel: function () {
    window.location = this._configModel.get('base_url');
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.apply(this);
  }

});
