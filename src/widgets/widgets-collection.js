var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Collection of Dataviews
 */
module.exports = Backbone.Collection.extend({
  comparator: 'order',

  initialize: function () {
    this._allDataviewsFetched = false;
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:order', _.debounce(this._onChangeOrder.bind(this), 10), this);
    // If a category model applies the category colors, rest should remove/disable
    // the category colors applied before.
    this.bind('change:autoStyle', function (changedWidgetModel, autoStyle) {
      if (autoStyle) {
        this.each(function (widgetModel) {
          // Only set if model actually has the attr (i.e. it's a category model)
          if (widgetModel.layerModel && widgetModel !== changedWidgetModel && widgetModel.layerModel.get('layer_name') === changedWidgetModel.layerModel.get('layer_name') && widgetModel.get('autoStyle')) {
            widgetModel.set('autoStyle', false);
          }
        });
      }
    }, this);
  },

  _onChangeOrder: function () {
    this.sort();
    this.trigger('orderChanged', this);
  },

  getStates: function () {
    var state = {};
    this.each(function (widgetModel) {
      var widgetState = widgetModel.getState();
      if (!_.isEmpty(widgetState)) {
        state[widgetModel.get('id')] = widgetState;
      }
    });
    return state;
  },

  setStates: function (states) {
    for (var i in states) {
      var widget = this.at(i);
      widget.setState(states[i]);
    }
  },

  hasInitialState: function () {
    return this._allDataviewsFetched;
  },

  initialState: function () {
    this._allDataviewsFetched = true;
  }
});
