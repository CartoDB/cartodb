var _ = require('underscore');

var REQUIRED_OPTS = [
  'map',
  'dashboard',
  'stateDefinitionModel'
];

var StateTracker = {

  init: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._dashboard._dashboard.widgets._widgetsCollection.bind('change', _.debounce(this.saveStateDefinition, 250), this);
    this._map.on('change', _.debounce(this.saveStateDefinition.bind(this), 500), this);
  },

  saveStateDefinition: function () {
    var state = this._dashboard.getState();
    this._stateDefinitionModel.updateState(state);
  }
};

module.exports = StateTracker;
