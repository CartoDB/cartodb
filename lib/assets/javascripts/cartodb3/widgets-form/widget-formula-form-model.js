var cdb = require('cartodb.js');
var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;

module.exports = cdb.core.Model.extend({

  schema: {
    type: {
      type: 'Select',
      options: ['histogram', 'category', 'formula', 'time-series']
    },
    layer_id: {
      type: 'Select',
      label: 'Source layer',
      options: []
    },
    column: {
      type: 'Select',
      options: []
    },
    title: {
      type: 'Text',
      validators: ['required']
    },
    sync: {
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
    },
    operation: {
      type: 'Select',
      options: ['min', 'max', 'count', 'avg']
    },
    suffix: {
      type: 'Text'
    },
    prefix: {
      type: 'Text'
    }
  },

  initialize: function () {
    this.bind('change:layer_id', this._onLayerIdChange, this);

    this._formView = new Backbone.Form({
      model: this
    });
  },

  _onLayerIdChange: function () {
    this.schema.column.options = []; // TODO: update column schema
    this._formView.trigger('update', this);
  },

  getFormView: function (argument) {
    return this._formView;
  }

});
