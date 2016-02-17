var $ = require('jquery');
var Backbone = require('backbone');
var cdb = require('cartodb-deep-insights.js');
var EditorWidgetsView = require('../widgets/widgets-view');
var TabPaneViewFactory = require('../../components/tab-pane/tab-pane-factory');
var StackLayoutView = require('../../components/stack-layout/stack-layout-view');
var WidgetsFormContentView = require('../widgets/widgets-form/widgets-form-content-view');
var Template = require('./template.tpl');
var TabPaneTemplate = require('./tab-pane-template.tpl');
var AddWidgetsView = require('../add-widgets/add-widgets-view');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.tablesCollection) throw new Error('tablesCollection is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._visDefinitionModel = opts.visDefinitionModel;

    this.template = this.options.template || Template;
    this._tablesCollection = opts.tablesCollection;
    this._modals = opts.modals;
  },

  render: function () {
    this.$el.html(this.template({
      vis_name: this._visDefinitionModel.get('name')
    }));

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

    this.$('.js-content').append(mapTabPaneView.render().$el);

    // TODO tmp; move to edit-content-view once the top-level tab pane is implemented
    var $addWidgetsBtn = $('<button class="Button Button--main"><span>Add widgets</span></button>');
    mapTabPaneView.$el.append($addWidgetsBtn);
    $addWidgetsBtn.on('click', function () {
      // Open a add-widgets-modal on page load
      self._modals.create(function (modalModel) {
        return new AddWidgetsView({
          modalModel: modalModel,
          tablesCollection: self._tablesCollection,
          layerDefinitionsCollection: self._layerDefinitionsCollection
        });
      });
    });

    return this;
  }
});
