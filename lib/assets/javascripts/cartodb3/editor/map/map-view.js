var Backbone = require('backbone');
var cdb = require('cartodb-deep-insights.js');
var EditorView = require('../editor-view');
var Template = require('./template.tpl');
var StackLayoutView = require('../../components/stack-layout/stack-layout-view');
var WidgetsFormContentView = require('../widgets/widgets-form/widgets-form-content-view');

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
          modals: self._modals,
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

    var stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    this.$('.js-content').append(stackLayoutView.render().$el);

    return this;
  }
});
