var CoreView = require('backbone/core-view');
var WidgetsFormContentDataView = require('./widgets-form-content-data-view');
var WidgetsFormContentStyleView = require('./widgets-form-content-style-view');
var createTextLabelsTabPane = require('../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./tab-pane.tpl');
var WidgetHeaderView = require('./widget-header.js');
var ScrollView = require('../../../components/scroll/scroll-view');

/**
 * View to render all necessary for the widget form
 */

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._userActions = opts.userActions;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._stackLayoutModel = opts.stackLayoutModel;
  },

  render: function () {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;

    this.tabPaneItems = [{
      selected: true,
      label: _t('editor.widgets.widgets-form.data.title-label'),
      createContentView: function () {
        var nodeId = self._widgetDefinitionModel.get('source');
        var analysisDefinitionNodeModel = self._analysisDefinitionNodesCollection.get(nodeId);
        return new ScrollView({
          createContentView: function () {
            return new WidgetsFormContentDataView({
              userActions: self._userActions,
              widgetDefinitionModel: self._widgetDefinitionModel,
              querySchemaModel: analysisDefinitionNodeModel.querySchemaModel
            });
          }
        });
      }
    }, {
      selected: false,
      label: _t('editor.widgets.widgets-form.style.title-label'),
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new WidgetsFormContentStyleView({
              userActions: self._userActions,
              widgetDefinitionModel: self._widgetDefinitionModel
            });
          }
        });
      }
    }];

    var options = {
      tabPaneOptions: {
        tagName: 'nav',
        className: 'CDB-NavMenu Editor-content',
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase'
      }
    };

    var header = new WidgetHeaderView({
      layerDefinitionModel: this._layerDefinitionsCollection.get(this._widgetDefinitionModel.get('layer_id')),
      model: this._widgetDefinitionModel
    });
    this.$el.append(header.render().$el);
    this.addView(header);

    this.tabPaneView = createTextLabelsTabPane(this.tabPaneItems, options);
    this.$el.append(this.tabPaneView.render().$el);
    this.addView(this.tabPaneView);
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep('widgets');
  }

});
