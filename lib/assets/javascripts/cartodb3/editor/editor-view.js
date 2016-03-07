var cdb = require('cartodb.js');
var $ = require('jquery');
var Backbone = require('backbone');
var AddWidgetsView = require('../components/modals/add-widgets/add-widgets-view');
var createTextLabelsTabPane = require('../components/tab-pane/create-text-labels-tab-pane');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');
var Header = require('./editor-header.js');
var TabPaneTemplate = require('./tab-pane.tpl');
var EditorWidgetsView = require('./widgets/widgets-view');
var LayersView = require('./layers/layers-view');

module.exports = cdb.core.View.extend({
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

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return new EditorWidgetsView({
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          widgetDefinitionsCollection: self._widgetDefinitionsCollection,
          stackLayoutModel: self._mapStackLayoutModel
        });
      }
    } ]);

    var tabPaneTabs = [{
      label: _t('editor.layers.title'),
      selected: true,
      createContentView: function () {
        return new LayersView({
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          analysisDefinitionsCollection: self._analysisDefinitionsCollection
        });
      }
    }, {
      label: _t('editor.elements.title'),
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.widgets.title'),
      createContentView: function () {
        return new StackLayoutView({
          collection: stackViewCollection
        });
      }
    }];

    var header = new Header({
      title: this._visDefinitionModel.get('name')
    });

    var tabPaneOptions = {
      tabPaneOptions: {
        tagName: 'nav',
        className: 'CDB-NavMenu',
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-Item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-Link'
      }
    };

    this._mapTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$el.append(header.render().$el);
    this.$el.append(this._mapTabPaneView.render().$el);

    // TODO tmp; move to edit-content-view once the top-level tab pane is implemented
    var $addWidgetsBtn = $('<button class="CDB-Button CDB-Button--primary"><span>Add widgets</span></button>');
    this.$el.append($addWidgetsBtn);
    $addWidgetsBtn.on('click', function () {
      // Open a add-widgets-modal on page load
      self._modals.create(function (modalModel) {
        return new AddWidgetsView({
          modalModel: modalModel,
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          widgetDefinitionsCollection: self._widgetDefinitionsCollection
        });
      });
    });

    return this;
  }
});
