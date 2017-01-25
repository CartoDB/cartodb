var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var createTuplesItems = require('./create-tuples-items');
var widgetsTypes = require('./widgets-types');
var BodyView = require('./body-view');
var template = require('./add-widgets.tpl');
var renderLoading = require('../../../components/loading/render-loading');
var TableStats = require('./tablestats.js');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-continue': '_onContinue'
  },

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');

    this._userActions = opts.userActions;
    this._modalModel = opts.modalModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._optionsCollection = new Backbone.Collection();
    this.tableStats = new TableStats({
      configModel: opts.configModel,
      userModel: opts.userModel
    });

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
      _.map(selectedOptionModels, function (selectedOptionModel) {
        this._userActions.saveWidgetOption(selectedOptionModel);
      }, this);
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
    var self = this;
    this._optionsCollection.reset();
    var tuplesItems = createTuplesItems(this._analysisDefinitionNodesCollection, this._layerDefinitionsCollection);

    _.each(widgetsTypes, function (d) {
      var models = d.createOptionModels(tuplesItems, this._widgetDefinitionsCollection);
      models = models.map(function (m) { m.stats = self.tableStats; return m; });
      this._optionsCollection.add(models);
    }, this);
  }
});
