var Backbone = require('backbone');
var cdb = require('cartodb-deep-insights.js');
var EditorWidgetsView = require('../widgets/widgets-view');
var TabPaneViewFactory = require('../../components/tab-pane/tab-pane-factory');
var StackLayoutView = require('../../components/stack-layout/stack-layout-view');
var WidgetsFormContentView = require('../widgets/widgets-form/widgets-form-content-view');

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
      label: 'layers',
      selected: true,
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: 'elements',
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: 'widgets',
      createContentView: function () {
        return new StackLayoutView({
          collection: stackViewCollection
        });
      }
    }]);

    this.$el.append(mapTabPaneView.render().$el);
    return this;
  }
});
