var cdb = require('cartodb.js');
// var WidgetFormFactory = require('./widgets-form-factory');
var template = require('./popup-content-types.tpl');

/**
 * Select for a Widget definition type.
 */
module.exports = cdb.core.View.extend({

  events: {
    'change .js-select': '_onTypeChange'
  },

  initialize: function (opts) {
    // if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    // if (!opts.layerTableModel) throw new Error('layerTableModel is required');

    // this._widgetDefinitionModel = opts.widgetDefinitionModel;
    // this._layerTableModel = opts.layerTableModel;
  },

  render: function () {
    this.$el.html(this._html());
    return this;
  },

  _html: function () {
    return template({
      // types: WidgetFormFactory.getDataTypes(this._layerTableModel),
      // selectedType: this._widgetDefinitionModel.get('type')
    });
  },

  _onTypeChange: function (ev) {
    // var newType = this.$('.js-select').val();
    // this._widgetDefinitionModel.changeType(newType);
  }

});
