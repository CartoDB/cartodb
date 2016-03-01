var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');
var LoadingView = require('../../loading/loading-view');
var ErrorView = require('../../error/error-view');
var createTuplesItems = require('./create-tuples-items');
var widgetsTypes = require('./widgets-types');
var BodyView = require('./body-view');
var template = require('./add-widgets.tpl');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal.
 *
 * The widget options to choose from needs to be calculated from columns derived from the available layers,
 * which may be async, so the actual options can not be created until after the layers' columns are fetched.
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
    this._optionsCollection = new Backbone.Collection();

    if (!this._hasFetchedAllLayerTables()) {
      var isNotFetched = _.compose(_.negate(Boolean), this._isFetched);
      this._layerTablesChain()
        .filter(isNotFetched)
        .each(function (m) {
          this.listenToOnce(m, 'sync', this._onLayerTableFetched);
          this.listenToOnce(m, 'error', this._onLayerTableFetchError);
          m.fetch();
        }, this);
    }

    this.listenTo(this._optionsCollection, 'change:selected', this._updateContinueButtonState);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    var view;
    if (this._failedFetch) {
      view = new ErrorView();
      this.$('.js-body').append(view.render().el);
    } else {
      view = new LoadingView({
        el: this.$('.js-body'),
        title: _t('components.modals.add-widgets.fetching-title'),
        predicate: this._hasFetchedAllLayerTables.bind(this),
        createContentView: this._newBodyView.bind(this)
      });
      view.render();
    }
    this.addView(view);
    this._updateContinueButtonState();

    return this;
  },

  _onContinue: function () {
    var selectedOptionModels = this._optionsCollection.filter(this._isSelected);

    if (selectedOptionModels.length > 0) {
      _.map(selectedOptionModels, function (m) {
        m.createUpdateOrSimilar(this._widgetDefinitionsCollection);
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

  _onLayerTableFetchError: function () {
    this._failedFetch = true;
    this.render();
  },

  /**
   * @param {Object} opts
   * @param {HTMLElement} opts.el
   */
  _newBodyView: function (opts) {
    this._createOptionsModels();
    return new BodyView({
      el: opts.el,
      optionsCollection: this._optionsCollection,
      widgetsTypes: widgetsTypes
    });
  },

  _updateContinueButtonState: function () {
    this.$('.js-continue').toggleClass('is-disabled', !this._optionsCollection.any(this._isSelected));
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  },

  _createOptionsModels: function () {
    var tuplesItems = createTuplesItems(this._layerDefinitionsCollection);

    _.each(widgetsTypes, function (d) {
      var models = d.createOptionModels(tuplesItems, this._widgetDefinitionsCollection);
      this._optionsCollection.add(models);
    }, this);
  }

});
