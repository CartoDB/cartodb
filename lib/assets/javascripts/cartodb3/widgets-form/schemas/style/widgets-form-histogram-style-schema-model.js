var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

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
