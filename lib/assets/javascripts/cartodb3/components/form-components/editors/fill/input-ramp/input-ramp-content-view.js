var _ = require('underscore');
var cdb = require('cartodb.js');
var template = require('./input-ramp-content-view.tpl');
var RampListView = require('./input-ramp-list-view');
var InputDialogContent = require('../input-categories/input-categories-dialog-content');

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
    if (!opts.columns) throw new Error('columns is required');
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.query) throw new Error('query param is required');

    this._bins = opts.bins;
    this._attribute = opts.attribute;
    this._quantification = opts.quantification;
    this._columns = opts.columns;
    this._configModel = opts.configModel;
    this._query = opts.query;

    this._column = _.find(this._columns, function (column) {
      return column.label === this._attribute;
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var view;

    if (this._column.type === 'string') {
      view = new InputDialogContent({
        configModel: this._configModel,
        query: this._query,
        model: this.model,
        columns: this._columns
      });
    } else {
      view = new RampListView({
        bins: this._bins,
        showSearch: false
      });
    }

    this.$el.append(template({
      columnType: this._column.type,
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
