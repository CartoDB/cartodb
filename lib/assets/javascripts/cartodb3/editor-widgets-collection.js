var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');
var EditorWidgetModel = require('./editor-widget-model');

module.exports = Backbone.Collection.extend({

  model: EditorWidgetModel,

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function() {
    this.bind('add', this._onAddWidget, this);
    this.bind('remove', this._onRemoveWidget, this);
    this.bind('change', this._onChangeWidget, this);
  },

  _onAddWidget: function(editorWidgetModel) {
    // TODO: waiting for DI public API
    // var referenceWidgetModel = dashboard.createHistogramWidget();
    // editorWidgetModel.setReferenceWidgetModel(referenceWidgetModel);
  },

  _onRemoveWidget: function(editorWidgetModel) {
    // TODO: waiting for DI public API
    // dashboard.destroyHistogramWidget();
  },

  _onChangeWidget: function(editorWidgetModel, attributeName) {
    if (attributeName === "type") {
      var data = editorWidgetModel.toJSON();
      this.remove(editorWidgetModel);
      this.add(data);
      return false;
    }

    if (attributeName === "order") {
      // TODO: to be done
      return false;
    }

    // TODO: update reference widget model
    // editorWidgetModel.updateReferenceWidgetModel();
    // OR
    // dashboard.updateHistogramModel('id', data);
  }

});
