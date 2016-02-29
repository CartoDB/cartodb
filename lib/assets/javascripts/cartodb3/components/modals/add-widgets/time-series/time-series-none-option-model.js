var cdb = require('cartodb.js');

/**
 * Special case for the time-series type, when if selected it deletes an existing time-series if there is one,
 * otherwise it does nothing.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'time-series'
  },

  createUpdateOrSimilar: function (widgetDefinitionsCollection) {
    var m = widgetDefinitionsCollection.find(this._isTimesSeries);
    if (m) {
      m.destroy({ wait: true });
    }
  },

  _isTimesSeries: function (m) {
    return m.get('type') === 'time-series';
  }
});
