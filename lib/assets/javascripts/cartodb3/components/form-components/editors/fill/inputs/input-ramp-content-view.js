var cdb = require('cartodb.js');
var template = require('./input-ramp-content-view.tpl');
var RampListView = require('./ramp-list-view');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-distribution': '_onClickDistribution',
    'click .js-buckets': '_onClickBuckets'
  },

  initialize: function (opts) {
    if (!opts.buckets) throw new Error('buckets is required');
    if (!opts.columnName) throw new Error('columnName is required');
    if (!opts.distribution) throw new Error('distribution is required');

    this._buckets = opts.buckets;
    this._columnName = opts.columnName;
    this._distribution = opts.distribution;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var view = new RampListView({
      buckets: this._buckets,
      showSearch: false
    });

    this.$el.append(template({
      buckets: this._buckets,
      columnName: this._columnName,
      distribution: this._distribution
    }));

    view.on('selectItem', function (item) {
      this.trigger('selectItem', item);
    }, this);

    this.$('.js-content').append(view.render().$el);

    return this;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _onClickDistribution: function (e) {
    this.killEvent(e);
    this.trigger('selectDistribution', this);
  },

  _onClickBuckets: function (e) {
    this.killEvent(e);
    this.trigger('selectBucket', this);
  }
});
