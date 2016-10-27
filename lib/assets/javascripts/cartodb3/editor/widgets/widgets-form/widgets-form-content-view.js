var CoreView = require('backbone/core-view');
var WidgetsFormView = require('./widgets-form-view');
var WidgetHeaderView = require('./widget-header.js');
var ScrollView = require('../../../components/scroll/scroll-view');

/**
 * View to render all necessary for the widget form
 */

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_goBack'
  },

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._userActions = opts.userActions;
    this._modals = opts.modals;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._stackLayoutPrevStep = opts._stackLayoutPrevStep;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._widgetDefinitionModel.bind('destroy', this._goBack, this);
    this.add_related_model(this._widgetDefinitionModel);
  },

  _initViews: function () {
    var self = this;
    var nodeId = self._widgetDefinitionModel.get('source');
    var analysisDefinitionNodeModel = self._analysisDefinitionNodesCollection.get(nodeId);

    var header = new WidgetHeaderView({
      layerDefinitionModel: this._layerDefinitionsCollection.get(this._widgetDefinitionModel.get('layer_id')),
      model: this._widgetDefinitionModel,
      modals: this._modals,
      userActions: this._userActions,
      stackLayoutModel: this._stackLayoutModel
    });
    this.$el.append(header.render().$el);
    this.addView(header);

    var view = new ScrollView({
      createContentView: function () {
        return new WidgetsFormView({
          userActions: self._userActions,
          widgetDefinitionModel: self._widgetDefinitionModel,
          querySchemaModel: analysisDefinitionNodeModel.querySchemaModel
        });
      }
    });

    this.$el.append(view.render().$el);
    this.addView(view);
  },

  _goBack: function () {
    if (this._stackLayoutPrevStep) {
      this._stackLayoutPrevStep();
    } else {
      this._stackLayoutModel.prevStep('widgets');
    }
  }

});
