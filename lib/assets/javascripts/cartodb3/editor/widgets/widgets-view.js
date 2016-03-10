var EditorWidgetView = require('./widget-view');
var AddWidgetsView = require('../../components/modals/add-widgets/add-widgets-view');
var template = require('./widgets-view.tpl');

/**
 * View to render widgets definitions overview
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-add-widget': '_addWidget'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._modals = opts.modals;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this.stackLayoutModel = opts.stackLayoutModel;

    this.listenTo(this._widgetDefinitionsCollection, 'add', this._addWidgetItem);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template);

    this._widgetDefinitionsCollection.each(this._addWidgetItem, this);

    return this;
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
  },

  _addWidgetItem: function (m) {
    var view = new EditorWidgetView({
      model: m,
      layer: this._layerDefinitionsCollection.get(m.get('layer_id')),
      stackLayoutModel: this.stackLayoutModel
    });
    this.addView(view);
    this.$('.js-widgets').append(view.render().el);
  }
});
