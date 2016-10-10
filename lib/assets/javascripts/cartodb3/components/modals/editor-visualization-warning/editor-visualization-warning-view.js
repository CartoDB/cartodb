var CoreView = require('backbone/core-view');
var template = require('./editor-visualization-warning.tpl');
var VisDefinitionModel = require('../../../data/vis-definition-model');
var renderLoading = require('../../loading/render-loading');
var ErrorView = require('../../error/error-view');
var errorParser = require('../../../helpers/error-parser');
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
    this._renderLoading('components.modals.editor-vis-warning.opening-title');

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
    this._renderLoading('editor.maps.duplicate.loading');

    var newVisModel = new VisDefinitionModel({
      name: this._visDefinitionModel.name
    }, {
      configModel: this._visDefinitionModel._configModel
    });

    newVisModel.save({
      source_visualization_id: this._visDefinitionModel.id
    }, {
      success: function (visModel) {
        window.location = visModel.builderURL();
      },
      error: function (mdl, e) {
        this._renderError(errorParser(e));
      }.bind(this)
    });
  },

  _renderLoading: function (renderTitle) {
    var mapName = this._visDefinitionModel.name;
    this.$el.html(
      renderLoading({
        title: _t(renderTitle, { name: mapName })
      })
    );
  },

  _renderError: function (errorMessage) {
    var mapName = this._visDefinitionModel.name;
    var errorView = new ErrorView({
      title: _t('editor.maps.duplicate.error', { name: mapName }),
      desc: errorMessage
    });
    this.$el.html(errorView.render().el);
    this.addView(errorView);
  },

  _goToDashboard: function () {
    window.location = this._visDefinitionModel._configModel.get('base_url');
  },

  _onCancel: function () {
    this._goToDashboard();
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.apply(this);
  }

});
