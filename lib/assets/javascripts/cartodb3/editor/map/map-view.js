var $ = require('jquery');
var Backbone = require('backbone');
var cdb = require('cartodb-deep-insights.js');
var EditorWidgetsView = require('../widgets/widgets-view');
var createTextLabelsTabPane = require('../../components/tab-pane/create-text-labels-tab-pane');
var StackLayoutView = require('../../components/stack-layout/stack-layout-view');
var WidgetsFormContentView = require('../widgets/widgets-form/widgets-form-content-view');
var Template = require('./template.tpl');
var TabPaneTemplate = require('./tab-pane-template.tpl');
var AddWidgetsView = require('../add-widgets/add-widgets-view');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.visDefinitionModel) throw new Error('_visDefinitionModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.modals) throw new Error('modals is required');

    this._modals = opts.modals;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this.template = this.options.template || Template;
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

    var mapTabPaneView = createTextLabelsTabPane([{
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
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          widgetDefinitionsCollection: self._widgetDefinitionsCollection
        });
      });
    });

    return this;
  }
});
