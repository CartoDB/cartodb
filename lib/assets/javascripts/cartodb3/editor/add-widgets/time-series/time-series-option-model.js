var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'time-series',
    layer_index: 0,
    tuples: []
  },

  createUpdateOrOtherwise: function (widgetDefinitionsCollection) {
    var i = this.get('layer_index');
    var item = this.get('tuples')[i];
    var columnName = item.columnModel.get('name');

    var attrs = {
      type: 'time-series',
      layer_id: item.layerDefinitionModel.id,
      column: columnName,
      title: this.get('title'),
      bins: this.get('bins'),
      start: this.get('start'),
      end: this.get('end')
    };

    var m = widgetDefinitionsCollection.find(this._isTimesSeries);
    if (m) {
      // TODO this will override any existing edits done; only update if tuple column/layer differs to existing widget
      m.save(attrs, { wait: true });
    } else {
      widgetDefinitionsCollection.create(attrs, { wait: true });
    }
  },

  _isTimesSeries: function (m) {
    return m.get('type') === 'time-series';
  }
});
