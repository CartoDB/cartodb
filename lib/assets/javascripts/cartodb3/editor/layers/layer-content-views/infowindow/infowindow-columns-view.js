var cdb = require('cartodb.js');
var $ = require('jquery');
var template = require('./infowindow-columns.tpl');
var ColumnView = require('./infowindow-column-view.js');

require('jquery-ui/sortable');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');

    this._columnsCollection = opts.columnsCollection;
  },

  render: function () {
    this._destroySortable();
    this.clearSubViews();
    if (this._columnsCollection.size() > 0) {
      this.$el.html(template);
      this._columnsCollection.each(this._addColumnItem, this);
      this._initSortable();
    } else {
      // this.$el.append(widgetPlaceholderTemplate());
    }
    return this;
  },

  _initSortable: function () {
    this.$('.js-columns').sortable({
      axis: 'y',
      // items: '> li.BlockList-item',
      items: '> li',
      opacity: 0.8,
      update: this._onSortableFinish.bind(this),
      forcePlaceholderSize: false
    }).disableSelection();
  },

  _destroySortable: function () {
    if (this.$('.js-columns').data('ui-sortable')) {
      this.$('.js-columns').sortable('destroy');
    }
  },

  _onSortableFinish: function () {
    // var self = this;
    // this.$('.js-columns > .js-columnItem').each(function (index, item) {
    //   var modelCid = $(item).data('model-cid');
    //   var model = self._widgetDefinitionsCollection.get(modelCid);
    //   model.save({ order: index });
    // });
  },

  _addColumn: function () {
    // var self = this;

    // this._modals.create(function (modalModel) {
    //   return new AddWidgetsView({
    //     modalModel: modalModel,
    //     layerDefinitionsCollection: self._layerDefinitionsCollection,
    //     widgetDefinitionsCollection: self._widgetDefinitionsCollection
    //   });
    // });
  },

  _addColumnItem: function (m) {
    var view = new ColumnView({
      model: m,
      // layer: this._layerDefinitionsCollection.get(m.get('layer_id')),
      // stackLayoutModel: this.stackLayoutModel
    });
    this.addView(view);
    this.$('.js-columns').append(view.render().el);
  },

  clean: function () {
    // this._destroySortable();
    // cdb.core.View.prototype.clean.apply(this);
  }
});
