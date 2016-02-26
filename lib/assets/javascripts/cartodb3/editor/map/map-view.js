var $ = require('jquery');
var Backbone = require('backbone');
var cdb = require('cartodb-deep-insights.js');
var EditorView = require('../editor-view');
var Template = require('./template.tpl');
var AddWidgetsView = require('../add-widgets/add-widgets-view');
var StackLayoutView = require('../../components/stack-layout/stack-layout-view');

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
    var self = this;
    this.$el.html(this.template({
      vis_name: this._visDefinitionModel.get('name')
    }));

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return new EditorView({
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          widgetDefinitionsCollection: self._widgetDefinitionsCollection,
          stackLayoutModel: stackLayoutModel
        });
      }
    }]);

    var stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    this.$('.js-content').append(stackLayoutView.render().$el);

    // TODO tmp; move to edit-content-view once the top-level tab pane is implemented
    var $addWidgetsBtn = $('<button class="CDB-Button CDB-Button--primary"><span>Add widgets</span></button>');
    stackLayoutView.$el.append($addWidgetsBtn);
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
