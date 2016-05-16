var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');
var createTuplesItems = require('./create-tuples-items');
var widgetsTypes = require('./widgets-types');
var BodyView = require('./body-view');
var template = require('./add-widgets.tpl');
var renderLoading = require('../../../components/loading/render-loading');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal.
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

    this._analysisDefinitionNodesCollection = this._layerDefinitionsCollection.getAnalysisDefinitionNodesCollection();
    this._analysisDefinitionNodesCollection.each(function (m) {
      m = m.querySchemaModel;
      m.on('change', this._onQuerySchemaChange, this);
      this.add_related_model(m);
      m.fetch();
    }, this);

    this.listenTo(this._optionsCollection, 'change:selected', this._updateContinueButtonState);
    this.add_related_model(this._optionsCollection);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    if (this._hasFetchedAllQuerySchemas()) {
      this._renderBodyView();
    } else {
      this._renderLoadingView();
    }

    this._updateContinueButtonState();

    return this;
  },

  _onQuerySchemaChange: function () {
    if (this._hasFetchedAllQuerySchemas()) {
      this.render();
    }
  },

  _hasFetchedAllQuerySchemas: function () {
    return this._analysisDefinitionNodesCollection.all(function (m) {
      return m.querySchemaModel.get('status') !== 'fetching';
    });
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

  _renderBodyView: function () {
    this._createOptionsModels();
    var view = new BodyView({
      el: this._$body(),
      optionsCollection: this._optionsCollection,
      widgetsTypes: widgetsTypes
    });
    this.addView(view.render());
  },

  _renderLoadingView: function () {
    this._$body().html(
      renderLoading({
        title: _t('components.modals.add-widgets.loading-title')
      })
    );
  },

  _$body: function () {
    return this.$('.js-body');
  },

  _updateContinueButtonState: function () {
    this.$('.js-continue').toggleClass('is-disabled', !this._optionsCollection.any(this._isSelected));
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  },

  _createOptionsModels: function () {
    this._optionsCollection.reset();
    var tuplesItems = createTuplesItems(this._analysisDefinitionNodesCollection, this._layerDefinitionsCollection);

    _.each(widgetsTypes, function (d) {
      var models = d.createOptionModels(tuplesItems, this._widgetDefinitionsCollection);
      this._optionsCollection.add(models);
    }, this);
  }
});
