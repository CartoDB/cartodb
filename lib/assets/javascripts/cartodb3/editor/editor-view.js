var Backbone = require('backbone');
var createTextLabelsTabPane = require('../components/tab-pane/create-text-labels-tab-pane');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');
var TabPaneTemplate = require('./tab-pane-template.tpl');
var EditorWidgetsView = require('./widgets/widgets-view');
var WidgetsFormContentView = require('./widgets/widgets-form/widgets-form-content-view');
var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
  },

  render: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return new EditorWidgetsView({
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          widgetDefinitionsCollection: self._widgetDefinitionsCollection,
          stackLayoutModel: stackLayoutModel
        });
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        var widgetDefinitionModel = opts[0];
        return new WidgetsFormContentView({
          widgetDefinitionModel: widgetDefinitionModel,
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          stackLayoutModel: stackLayoutModel
        });
      }
    }]);

    var tabPaneTabs = [{
      label: _t('editor.layers.title'),
      selected: true,
      createContentView: function () {
        return new cdb.core.View();
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
    this.$el.append(this._mapTabPaneView.render().$el);

    return this;
  }
});
