var ColumnView = require('./infowindow-column-view.js');
var template = require('./infowindow-columns.tpl');
var cdb = require('cartodb.js');
var $ = require('jquery');

require('jquery-ui/sortable');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');

    this._layerInfowindowModel = opts.layerInfowindowModel;
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
    var self = this;
    this.$('.js-columns > .js-column').each(function (index, item) {
      var modelCid = jQuery(item).data('model-cid');
      var model = self._columnsCollection.get(modelCid);
      model.save({ order: index });
    });
  },

  _addColumnItem: function (m) {
    var view = new ColumnView({
      model: m
    });
    this.addView(view);
    this.$('.js-columns').append(view.render().el);
  },

  clean: function () {
    this._destroySortable();
    cdb.core.View.prototype.clean.apply(this);
  }
});
