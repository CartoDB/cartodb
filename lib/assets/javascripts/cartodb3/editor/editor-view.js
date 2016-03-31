var cdb = require('cartodb.js');
var Backbone = require('backbone');
var createTextLabelsTabPane = require('../components/tab-pane/create-text-labels-tab-pane');
var AddWidgetsView = require('../components/modals/add-widgets/add-widgets-view');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');
var Header = require('./editor-header.js');
var TabPaneTemplate = require('./tab-pane.tpl');
var EditorWidgetsView = require('./widgets/widgets-view');
var LayersView = require('./layers/layers-view');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-add': '_addItem'
  },

  initialize: function (opts) {
    if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.mapStackLayoutModel) throw new Error('mapStackLayoutModel is required');

    this._modals = opts.modals;
    this._analysisDefinitionsCollection = opts.analysisDefinitionsCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._mapStackLayoutModel = opts.mapStackLayoutModel;
  },

  render: function () {
    var self = this;

    var editorWidgetsView = new EditorWidgetsView({
      modals: self._modals,
      layerDefinitionsCollection: self._layerDefinitionsCollection,
      widgetDefinitionsCollection: self._widgetDefinitionsCollection,
      stackLayoutModel: self._mapStackLayoutModel
    });

    var layersView = new LayersView({
      layerDefinitionsCollection: self._layerDefinitionsCollection,
      analysisDefinitionsCollection: self._analysisDefinitionsCollection,
      modals: self._modals,
      stackLayoutModel: self._mapStackLayoutModel
    });

    var tabPaneTabs = [{
      name: 'layers',
      label: _t('editor.tab-pane.layers.title-label'),
      selected: this.options.selectedTabItem === 'layers',
      createContentView: function () {
        var layersStackViewCollection = new Backbone.Collection([{
          createStackView: function (stackLayoutModel, opts) {
            return layersView;
          }
        }]);

        return new StackLayoutView({
          collection: layersStackViewCollection
        });
      }
    }, {
      name: 'elements',
      label: _t('editor.tab-pane.elements.title-label'),
      selected: this.options.selectedTabItem === 'elements',
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      name: 'widgets',
      label: _t('editor.tab-pane.widgets.title-label'),
      selected: this.options.selectedTabItem === 'widgets',
      createContentView: function () {
        var widgetsStackViewCollection = new Backbone.Collection([{
          createStackView: function (stackLayoutModel, opts) {
            return editorWidgetsView;
          }
        }]);

        return new StackLayoutView({
          collection: widgetsStackViewCollection
        });
      }
    }];

    var header = new Header({
      title: this._visDefinitionModel.get('name')
    });

    var tabPaneOptions = {
      tabPaneOptions: {
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-Item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-Link u-upperCase'
      }
    };

    this._mapTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$el.append(header.render().$el);
    this.$el.append(this._mapTabPaneView.render().$el);

    return this;
  },

  _addItem: function () {
    var selectedTab = this._mapTabPaneView.collection.getSelected();

    switch (selectedTab.get('name')) {
      case 'widgets': this._addWidget();
        break;
      case 'layers':
        // TODO: trigger layer creation
        break;
      case 'elements':
        // TODO: trigger element creation
        break;
    }
  },

  _addWidget: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new AddWidgetsView({
        modalModel: modalModel,
        layerDefinitionsCollection: self._layerDefinitionsCollection,
        widgetDefinitionsCollection: self._widgetDefinitionsCollection
      });
    });
  }
});
