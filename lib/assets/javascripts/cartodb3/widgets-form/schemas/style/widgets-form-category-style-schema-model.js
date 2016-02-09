var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, options) {
    this.widgetDefinitionModel = options.widgetDefinitionModel;
    this._setAttributes();
    this._generateSchema();
  },

  _setAttributes: function () {
    var m = this.widgetDefinitionModel;
    this.set({
      syncData: m.get('syncData'),
      syncBoundingBox: m.get('syncBoundingBox')
    });
  },

  updateDefinitionModel: function () {
    this.widgetDefinitionModel.set({
      syncData: this.get('syncData'),
      syncBoundingBox: this.get('syncBoundingBox')
    });
  },

  _generateSchema: function () {
    this.schema = {
      syncData: {
        type: 'Radio',
        label: 'Unfiltered',
        options: [
          {
            val: true,
            label: 'yes'
          }, {
            val: false,
            label: 'no'
          }
        ]
      },
      syncBoundingBox: {
        type: 'Radio',
        label: 'Dynamic',
        options: [
          {
            val: true,
            label: 'yes'
          }, {
            val: false,
            label: 'no'
          }
        ]
      }
    };
  }

});
