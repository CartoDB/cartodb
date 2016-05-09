var cdb = require('cartodb.js');
var template = require('./input-ramp-content-view.tpl');
var RampListView = require('./ramp-list-view');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-quantification': '_onClickQuantification',
    'click .js-bins': '_onClickBins'
  },

  initialize: function (opts) {
    if (!opts.bins) throw new Error('bins is required');
    if (!opts.attribute) throw new Error('attribute is required');
    if (!opts.quantification) throw new Error('quantification is required');

    this._bins = opts.bins;
    this._attribute = opts.attribute;
    this._quantification = opts.quantification;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var view = new RampListView({
      bins: this._bins,
      showSearch: false
    });

    this.$el.append(template({
      bins: this._bins,
      attribute: this._attribute,
      quantification: this._quantification
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

  _onClickQuantification: function (e) {
    this.killEvent(e);
    this.trigger('selectQuantification', this);
  },

  _onClickBins: function (e) {
    this.killEvent(e);
    this.trigger('selectBins', this);
  }
});
