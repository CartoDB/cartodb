var _ = require('underscore');
var WidgetOptionModel = require('builder/components/modals/add-widgets/widget-option-model');

/**
 * Special case for the time-series type, when if selected it deletes an existing time-series if there is one,
 * otherwise it does nothing.
 */
module.exports = WidgetOptionModel.extend({

  defaults: _.defaults({type: 'time-series'}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var m = widgetDefinitionsCollection.find(this._isTimesSeries);
    if (m) {
      m.destroy({ wait: true });
    }
  },

  _isTimesSeries: function (m) {
    return m.get('type') === 'time-series';
  }
});
