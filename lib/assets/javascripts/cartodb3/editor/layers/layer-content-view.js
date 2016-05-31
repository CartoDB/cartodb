var cdb = require('cartodb.js');
var createTextLabelsTabPane = require('../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./layer-tab-pane.tpl');
var Header = require('./layer-header-view.js');
var AnalysesView = require('./layer-content-views/analyses-view');
var StyleView = require('../style/style-view');
var InfowindowsView = require('./layer-content-views/infowindows-view');
var ScrollView = require('../../components/scroll/scroll-view');

var Infobox = require('../../components/infobox/infobox-view');
var InfoboxModel = require('../../components/infobox/infobox-view-model');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.analysis) throw new Error('analysis is required');

    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this.stackLayoutModel = opts.stackLayoutModel;
    this.modals = opts.modals;
    this._configModel = opts.configModel;
    this._editorModel = opts.editorModel;
    this.analysis = opts.analysis;

    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
  },

  render: function () {
    this._unbindEvents();

    var self = this;
    var tabPaneTabs = [{
      label: _t('editor.layers.menu-tab-pane-labels.data'),
      name: 'data',
      selected: !this.options.selectedNode,
      createContentView: function () {

        function click () {
          console.log('click from infobox');
        }

        var infoboxModel = new InfoboxModel({
          type: 'error',
          title: 'Hola mundo',
          body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Assumenda at quidem eveniet laborum nesciunt odio illum, consequuntur culpa mollitia officiis dicta, iusto minus, fugiat molestiae! Quibusdam iure nobis vitae, voluptatem?',
          show: true,
          primaryButton: {
            type: 'link',
            label: 'Close',
            action: click
          }
        });

        return new Infobox({
          model: infoboxModel
        });

        // return new cdb.core.View();
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.analyses'),
      name: 'analyses',
      selected: !!this.options.selectedNode,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new AnalysesView({
              className: 'Editor-content',
              layerDefinitionModel: self.layerDefinitionModel,
              modals: self.modals,
              analysis: self.analysis,
              selectedNode: self.options.selectedNode
            });
          }
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.style'),
      name: 'style',
      createContentView: function () {
        var lastLayerNodeModel = self.layerDefinitionModel.getAnalysisDefinitionNodeModel();
        return new StyleView({
          className: 'Editor-content',
          analysisDefinitionsCollection: self.analysisDefinitionsCollection,
          querySchemaModel: lastLayerNodeModel.querySchemaModel,
          layerDefinitionsCollection: self.layerDefinitionsCollection,
          layerDefinitionModel: self.layerDefinitionModel,
          editorModel: self._editorModel,
          modals: self.modals
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.infowindow'),
      name: 'infowindow',
      createContentView: function () {
        return new InfowindowsView({
          className: 'Editor-content',
          layerDefinitionModel: self.layerDefinitionModel,
          querySchemaModel: self.layerDefinitionModel.getAnalysisDefinitionNodeModel().querySchemaModel,
          configModel: self._configModel,
          editorModel: self._editorModel
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.legends'),
      name: 'legends',
      createContentView: function () {
        return new cdb.core.View({
          className: 'Editor-content'
        });
      }
    }];

    var header = new Header({
      layerDefinitionModel: this.layerDefinitionModel,
      editorModel: this._editorModel
    });

    this.addView(header);
    this.$el.append(header.render().$el);

    var tabPaneOptions = {
      tabPaneOptions: {
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

    this._layerTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this._bindEvents();
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);
    return this;
  },

  _unbindEvents: function () {
    if (this._layerTabPaneView && this._layerTabPaneView.collection) {
      this._layerTabPaneView.collection.off('change:selected', this._quitEditing, this);
    }
  },

  _bindEvents: function () {
    this._layerTabPaneView.collection.on('change:selected', this._quitEditing, this);
    this.add_related_model(this._layerTabPaneView.collection);
  },

  _onClickBack: function () {
    this._editorModel.set({ edition: false });
    this.stackLayoutModel.prevStep('layers');
  },

  _changeStyle: function () {
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());
    this._layerTabPaneView.changeStyleMenu(this._editorModel);
  },

  _quitEditing: function () {
    if (this._layerTabPaneView.getSelectedTabPaneName() !== 'style') {
      this._editorModel.set({ edition: false });
    }
  }
});
