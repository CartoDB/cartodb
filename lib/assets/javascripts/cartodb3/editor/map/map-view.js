var Backbone = require('backbone');
var cdb = require('cartodb.js');
var EditorWidgetsView = require('../widgets/widgets-view');
var TabPaneViewFactory = require('../../components/tab-pane/tab-pane-factory');
var StackLayoutView = require('../../components/stack-layout/stack-layout-view');
var WidgetsFormContentView = require('../widgets/widgets-form/widgets-form-content-view');
var TabPaneTemplate = require('./tab-pane-template.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._visDefinitionModel = opts.visDefinitionModel;
  },

  render: function () {
    var self = this;
    // TODO for now we only render widgets, but at some point this should be "wrapped" by a EditorView
    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return new EditorWidgetsView({
          stackLayoutModel: stackLayoutModel,
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          widgetDefinitionsCollection: self._visDefinitionModel.widgetDefinitionsCollection
        });
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        var widgetDefinitionModel = opts[0];
        var tableModel = opts[1];
        return new WidgetsFormContentView({
          widgetDefinitionModel: widgetDefinitionModel,
          tableModel: tableModel,
          stackLayoutModel: stackLayoutModel
        });
      }
    }]);

    var mapTabPaneView = TabPaneViewFactory.createWithTextLabels([{
      label: 'LAYERS',
      selected: true,
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: 'ELEMENTS',
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: 'WIDGETS',
      createContentView: function () {
        return new StackLayoutView({
          collection: stackViewCollection
        });
      }
    }], {
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
    });

    this.$el.append(mapTabPaneView.render().$el);
    return this;
  }
});
