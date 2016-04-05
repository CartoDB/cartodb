var cdb = require('cartodb.js');
var Backbone = require('backbone');
var createTextLabelsTabPane = require('../components/tab-pane/create-text-labels-tab-pane');
var AddWidgetsView = require('../components/modals/add-widgets/add-widgets-view');
var AddLayerView = require('../components/modals/add-layer/add-layer-view');
var AddLayerModel = require('../components/modals/add-layer/add-layer-model');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');
var Header = require('./editor-header.js');
var EditorTabPaneTemplate = require('./editor-tab-pane.tpl');
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
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._modals = opts.modals;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._analysisDefinitionsCollection = opts.analysisDefinitionsCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._mapStackLayoutModel = opts.mapStackLayoutModel;

    this._layerDefinitionsCollection.on('reset remove add', this._updateAddButtonState, this);
    this._widgetDefinitionsCollection.on('reset remove add', this._updateAddButtonState, this);
  },

  render: function () {
    var self = this;

    var tabPaneTabs = [{
      name: 'layers',
      label: _t('editor.tab-pane.layers.title-label'),
      selected: this.options.selectedTabItem === 'layers',
      createContentView: function () {
        var layersStackViewCollection = new Backbone.Collection([{
          createStackView: function (stackLayoutModel, opts) {
            return new LayersView({
              userModel: self._userModel,
              configModel: self._configModel,
              layerDefinitionsCollection: self._layerDefinitionsCollection,
              analysisDefinitionsCollection: self._analysisDefinitionsCollection,
              modals: self._modals,
              stackLayoutModel: self._mapStackLayoutModel
            });
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
            return new EditorWidgetsView({
              modals: self._modals,
              layerDefinitionsCollection: self._layerDefinitionsCollection,
              widgetDefinitionsCollection: self._widgetDefinitionsCollection,
              stackLayoutModel: self._mapStackLayoutModel
            });
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
        template: EditorTabPaneTemplate,
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
    this._mapTabPaneView.collection.bind('change:selected', this._updateAddButtonState, this);

    this.$el.append(header.render().$el);
    this.$el.append(this._mapTabPaneView.render().$el);

    this._updateAddButtonState();

    return this;
  },

  _hideAddButton: function () {
    this.$('.js-add').addClass('is-hidden');
  },

  _showAddButton: function () {
    this.$('.js-add').removeClass('is-hidden');
  },

  _updateAddButtonState: function () {
    this._hideAddButton();

    switch (this._mapTabPaneView.getSelectedTabPaneName()) {
      case 'widgets':
        if (this._widgetDefinitionsCollection.size()) {
          this._showAddButton();
        }
        break;
      case 'layers':
        if (this._layerDefinitionsCollection.size()) {
          this._showAddButton();
        }
        break;
      case 'elements':
        // TODO: trigger element creation
        break;
    }
  },

  _addItem: function () {
    switch (this._mapTabPaneView.getSelectedTabPaneName()) {
      case 'widgets': this._addWidget();
        break;
      case 'layers': this._addLayer();
        break;
      case 'elements':
        // TODO: trigger element creation
        break;
    }
  },

  _addLayer: function () {
    var self = this;
    this._modals.create(function (modalModel) {
      var addLayerModel = new AddLayerModel({}, {
        visMap: self._layerDefinitionsCollection._visMap,
        userModel: self._userModel,
        configModel: self._configModel
      });

      return new AddLayerView({
        modalModel: modalModel,
        userModel: self._userModel,
        createModel: addLayerModel
      });
    });
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
