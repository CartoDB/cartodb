var _ = require('underscore');
var cdb = require('cartodb.js');
var LoadingView = require('../../components/loading/loading-view');
var AddWidgetsBodyView = require('./add-widgets-body-view');
var template = require('./add-widgets.tpl');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal
 */
module.exports = cdb.core.View.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-continue': '_onContinue'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._modalModel = opts.modalModel;

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    if (!this._hasFetchedAllLayerTables()) {
      var isNotFetched = _.compose(_.negate(Boolean), this._isFetched);
      this._layerTablesChain()
        .filter(isNotFetched)
        .each(function (m) {
          this.listenToOnce(m, 'change:fetched', this._onLayerTableFetched);
          m.fetch();
        }, this);
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    var view = new LoadingView({
      el: this.$('.js-body'),
      title: _t('editor.add-widgets.fetching-tables-title'),
      predicate: this._hasFetchedAllLayerTables.bind(this),
      createContentView: this._newBodyView.bind(this)
    });
    this.addView(view);
    view.render();

    return this;
  },

  _onContinue: function () {
    var didConfirm = confirm('ORLY?'); // eslint-disable-line
    if (didConfirm) {
      this._modalModel.destroy();
    }
  },

  _isFetched: function (m) {
    return !!m.get('fetched');
  },

  _hasFetchedAllLayerTables: function () {
    return this._layerTablesChain()
      .all(this._isFetched)
      .value();
  },

  _layerTablesChain: function () {
    return this._layerDefinitionsCollection
      .chain()
      .reduce(function (memo, m) {
        if (m.layerTableModel) {
          memo.push(m.layerTableModel);
        }
        return memo;
      }, []);
  },

  _onLayerTableFetched: function () {
    if (this._hasFetchedAllLayerTables()) {
      this.render();
    }
  },

  /**
   * @param {Object} opts
   * @param {HTMLElement} opts.el
   */
  _newBodyView: function (opts) {
    return new AddWidgetsBodyView({
      el: opts.el,
      layerDefinitionsCollection: this._layerDefinitionsCollection
    });
  }
});
