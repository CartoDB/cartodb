var cdb = require('cartodb.js');
var InfowindowContentClickStyleView = require('./infowindow-style-view');
var InfowindowContentClickItemsView = require('./infowindow-items-view');

/**
 * Select for an Infowindow style type.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    this._layerTableModel = opts.layerTableModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    // TODO: carousel
    var styleView = new InfowindowContentClickStyleView({
    });
    this.addView(styleView);
    this.$el.append(styleView.render().el);

    var itemsView = new InfowindowContentClickItemsView({
      layerTableModel: this._layerTableModel
    });
    this.addView(itemsView);
    this.$el.append(itemsView.render().el);

    return this;
  }

});
