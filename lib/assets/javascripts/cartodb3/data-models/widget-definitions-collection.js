var Backbone = require('backbone');

/**
 * Collection of widget definitions.
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    this._initBinds();
  },

  url: function () {
    throw new Error('creator of this collection should define the URL');
  },

  _initBinds: function () {
    this.bind('add', this._onAddWidget, this);
    this.bind('remove', this._onRemoveWidget, this);
    this.bind('change', this._onChangeWidget, this);
  },

  _onAddWidget: function (m) {
    // TODO: waiting for DI public API
    // var referenceWidgetModel = dashboard.createHistogramWidget();
    // m.setReferenceWidgetModel(referenceWidgetModel);
  },

  _onRemoveWidget: function (m) {
    // TODO: waiting for DI public API
    // dashboard.destroyHistogramWidget();
  },

  _onChangeWidget: function (m, attributeName) {
    if (attributeName === 'type') {
      var data = m.toJSON();
      this.remove(m);
      this.add(data);
      return false;
    }

    if (attributeName === 'order') {
      // TODO: to be done
      return false;
    }

  // TODO: update reference widget model
  // m.updateReferenceWidgetModel();
  // OR
  // dashboard.updateHistogramModel('id', data);
  }

});
