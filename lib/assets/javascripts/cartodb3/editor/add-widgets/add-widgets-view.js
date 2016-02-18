var _ = require('underscore');
var cdb = require('cartodb.js');
var Backbone = require('backbone');
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
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');

    this._modalModel = opts.modalModel;

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._selectedCollection = new Backbone.Collection();

    if (!this._hasFetchedAllLayerTables()) {
      var isNotFetched = _.compose(_.negate(Boolean), this._isFetched);
      this._layerTablesChain()
        .filter(isNotFetched)
        .each(function (m) {
          this.listenToOnce(m, 'change:fetched', this._onLayerTableFetched);
          m.fetch();
        }, this);
    }

    this.listenTo(this._selectedCollection, 'add remove reset', this._onSelectedChange);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    var view = new LoadingView({
      el: this.$('.js-body'),
      title: _t('editor.add-widgets.fetching-title'),
      predicate: this._hasFetchedAllLayerTables.bind(this),
      createContentView: this._newBodyView.bind(this)
    });
    this.addView(view);
    view.render();

    return this;
  },

  _onContinue: function () {
    var selection = this._selectedCollection.filter(this._isSelected);
    if (selection.length > 0) {
      _.map(selection, function (m) {
        return m.createWidgetDefinitionModel(this._widgetDefinitionsCollection);
      }, this);
      // for now assumes all widgets are created fine
      // TODO show loading again, indicate creation status
      // TODO error handling
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
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      selectedCollection: this._selectedCollection
    });
  },

  _onSelectedChange: function () {
    this.$('.js-continue').toggleClass('is-disabled', this._selectedCollection.length === 0);
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  }
});
