var EditorWidgetView = require('./widget-view');
var AddWidgetsView = require('../../components/modals/add-widgets/add-widgets-view');
var template = require('./widgets-view.tpl');
var widgetPlaceholderTemplate = require('./widgets-placeholder.tpl');
var CoreView = require('backbone/core-view');
var $ = require('jquery');

require('jquery-ui');

/**
 * View to render widgets definitions overview
 */
module.exports = CoreView.extend({

  events: {
    'click .js-add-widget': '_addWidget'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._modals = opts.modals;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this.stackLayoutModel = opts.stackLayoutModel;
    this._configModel = opts.configModel;

    this.listenTo(this._widgetDefinitionsCollection, 'add', this._goToWidget);
    this.listenTo(this._widgetDefinitionsCollection, 'remove', this.render);
  },

  render: function () {
    this._destroySortable();
    this.clearSubViews();
    if (this._widgetDefinitionsCollection.size() > 0) {
      this.$el.html(template);
      this._widgetDefinitionsCollection.each(this._addWidgetItem, this);
      this._initSortable();
    } else {
      this.$el.append(widgetPlaceholderTemplate());
    }
    return this;
  },

  _initSortable: function () {
    this.$('.js-widgets').sortable({
      axis: 'y',
      items: '> li.BlockList-item',
      opacity: 0.8,
      update: this._onSortableFinish.bind(this),
      forcePlaceholderSize: false
    }).disableSelection();
  },

  _destroySortable: function () {
    if (this.$('.js-widgets').data('ui-sortable')) {
      this.$('.js-widgets').sortable('destroy');
    }
  },

  _onSortableFinish: function () {
    var self = this;
    this.$('.js-widgets > .js-widgetItem').each(function (index, item) {
      var modelCid = $(item).data('model-cid');
      var model = self._widgetDefinitionsCollection.get(modelCid);
      model.save({ order: index });
    });
  },

  _addWidget: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new AddWidgetsView({
        modalModel: modalModel,
        configModel: self._configModel,
        layerDefinitionsCollection: self._layerDefinitionsCollection,
        widgetDefinitionsCollection: self._widgetDefinitionsCollection
      });
    });
  },

  _goToWidget: function (widgetModel) {
    this.stackLayoutModel.nextStep(widgetModel, 'widget-content');
  },

  _addWidgetItem: function (m) {
    var view = new EditorWidgetView({
      model: m,
      layer: this._layerDefinitionsCollection.get(m.get('layer_id')),
      stackLayoutModel: this.stackLayoutModel
    });
    this.addView(view);
    this.$('.js-widgets').append(view.render().el);
  },

  clean: function () {
    this._destroySortable();
    CoreView.prototype.clean.apply(this);
  }
});
