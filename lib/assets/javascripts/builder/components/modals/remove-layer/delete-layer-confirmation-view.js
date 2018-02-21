var _ = require('underscore');
var ConfirmationView = require('builder/components/modals/confirmation/modal-confirmation-view');
var ExportView = require('builder/editor/components/modals/export-map/modal-export-map-view.js');
var ExportMapModel = require('builder/data/export-map-definition-model.js');
var templateConfirmation = require('builder/editor/layers/delete-layer-confirmation.tpl');
var removeLayer = require('builder/editor/layers/operations/remove-layer');

var REQUIRED_OPTS = [
  'modalModel',
  'layerModel',
  'modals',
  'widgetDefinitionsCollection',
  'visDefinitionModel',
  'userActions'
];
/**
 *  Remove layer modal dialog
 */

module.exports = ConfirmationView.extend({
  className: 'Dialog-content',

  events: function () {
    return _.extend({}, ConfirmationView.prototype.events, {
      'click [data-event=exportMapAction]': '_exportMap'
    });
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    if (opts.loadingTitle) {
      this._hasLoading = true;
      this._loadingTitle = opts.loadingTitle;
    }
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      templateConfirmation({
        layerName: this._layerModel.getName(),
        layerVisName: this._visDefinitionModel.get('name'),
        affectedItemsMessages: this._getAffectedItemsMessages()
      })
    );
    return this;
  },

  _getAffectedItemsByLayer: function () {
    var layerModel = this._layerModel;
    var widgetDefinitionsCollection = this._widgetDefinitionsCollection;

    return [
      { widgets: widgetDefinitionsCollection.widgetsOwnedByLayer(layerModel.get('id')) },
      { analyses: layerModel.getNumberOfAnalyses() },
      { layers: layerModel.getAllDependentLayers() }
    ];
  },

  _getAffectedItemsMessages: function () {
    var affectedItems = this._getAffectedItemsByLayer();
    var affectedTemplateMessages = [];

    for (var i = 0; i < affectedItems.length; i++) {
      for (var key in affectedItems[i]) {
        if (affectedItems[i][key] > 0) {
          var text = _t('editor.layers.delete.' + key, { smart_count: affectedItems[i][key] });
          affectedTemplateMessages.push(text);
        }
      }
    }
    return affectedTemplateMessages;
  },

  _exportMap: function () {
    var self = this;

    this._modals.create(function () {
      var exportMapModel = new ExportMapModel({
        visualization_id: self._visDefinitionModel.get('id')
      }, {
        configModel: this.configModel
      });

      return new ExportView({
        modalModel: self._modalModel,
        exportMapModel: exportMapModel,
        renderOpts: {
          name: self._visDefinitionModel.get('name')
        }
      });
    });
  },

  _runAction: function () {
    removeLayer({
      userActions: this._userActions,
      layerDefinitionModel: this._layerModel
    });

    this._modalModel.destroy();
  }
});
