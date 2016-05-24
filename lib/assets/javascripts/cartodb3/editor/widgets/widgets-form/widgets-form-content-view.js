var cdb = require('cartodb.js');
var WidgetsFormContentDataView = require('./widgets-form-content-data-view');
var WidgetsFormContentStyleView = require('./widgets-form-content-style-view');
var createTextLabelsTabPane = require('../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./tab-pane.tpl');
var Header = require('./widget-header.js');
var ScrollView = require('../../../components/scroll/scroll-view');

/**
 * View to render all necessary for the widget form
 */

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._widgetDefinitionModel = opts.widgetDefinitionModel;
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
        var sourceId = self._widgetDefinitionModel.get('source_id');
        var analysisDefinitionNodeModel = self._analysisDefinitionNodesCollection.get(sourceId);
        return new ScrollView({
          createContentView: function () {
            return new WidgetsFormContentDataView({
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

    var header = new Header({
      title: this._widgetDefinitionModel.get('title')
    });

    this.tabPaneView = createTextLabelsTabPane(this.tabPaneItems, options);
    this.$el.append(header.render().$el);
    this.$el.append(this.tabPaneView.render().$el);
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep('widgets');
  }

});
