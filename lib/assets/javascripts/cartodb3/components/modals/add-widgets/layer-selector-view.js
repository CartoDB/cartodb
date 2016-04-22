var _ = require('underscore');
var cdb = require('cartodb.js');
var template = require('./layer-selector.tpl');

/**
 * View for selecting the layer through which to load the column data.
 */
module.exports = cdb.core.View.extend({

  tagName: 'select',

  className: 'CDB-SelectFake CDB-Text',

  events: {
    'change': '_onChange'
  },

  initialize: function (opts) {
    this.listenTo(this.model, 'change:layer_index', this.render);
  },

  render: function () {
    this.$el.html(this._html());
    return this;
  },

  _html: function () {
    var i = this.model.get('layer_index');
    var tuples = this.model.get('tuples');

    return template({
      layerIndex: i,
      layerNames: _.map(tuples, function (item) {
        return item.analysisDefinitionModel.get('id');
      })
    });
  },

  _onChange: function () {
    var val = this.$el.val();
    this.model.set('layer_index', parseInt(val, 10));
  }

});
