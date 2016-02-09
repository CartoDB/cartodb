var WidgetFormSchemaModel = require('../widgets-form-schema-model');

module.exports = WidgetFormSchemaModel.extend({

  initialize: function () {
    this._generateSchema();
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
