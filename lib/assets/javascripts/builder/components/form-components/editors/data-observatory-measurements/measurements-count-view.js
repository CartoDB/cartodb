var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var template = require('./measurements-count.tpl');

var REQUIRED_OPTS = [
  'model'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._initBinds();
  },

  render: function () {
    var query = this.model.get('query');
    var isFiltering = this.model.get('filtering');
    var items = this.model.get('items');
    var count;

    if (query === '' && !isFiltering) {
      count = _t('analyses.data-observatory-measure.count.suggested');
    } else {
      count = _t('analyses.data-observatory-measure.count.search', {
        items: items
      });
    }

    this.$el.html(template({
      items: count
    }));
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:items', this.render);
  }
});
