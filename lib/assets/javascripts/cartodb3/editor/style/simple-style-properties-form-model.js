var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    fill: 10,
    labels_enabled: 'enabled',
    labels: {
      radius: 10,
      width: 20
    }
  },

  initialize: function () {
    this.schema = this._generateSchema();
  },

  _generateSchema: function () {
    var nestedModel = cdb.core.Model.extend({
      schema: {
        radius: {
          type: 'Number'
        },
        width: {
          type: 'Number'
        }
      }
    });

    return {
      fill: {
        type: 'Number',
        help: 'Hello man'
      },
      labels_enabled: {
        type: 'Select',
        options: ['enabled', 'disabled']
      },
      labels: {
        type: 'NestedModel',
        model: nestedModel,
        title: false,
        options: {
          enabledBy: {
            key: 'labels_enabled',
            validation: /enabled/
          }
        }
      }
    };
  }

});
