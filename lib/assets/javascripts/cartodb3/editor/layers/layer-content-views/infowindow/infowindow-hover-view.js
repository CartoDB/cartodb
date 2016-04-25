var cdb = require('cartodb.js');
var InfowindowContentHoverStyleView = require('./infowindow-style-view');
var InfowindowContentHoverItemsView = require('./infowindow-items-view');

/**
 * Select for an Infowindow style type.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    this._layerTableModel = opts.layerTableModel;
    this._layerInfowindowModel = opts.layerInfowindowModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    // TODO: carousel
    var styleView = new InfowindowContentHoverStyleView({
    });
    this.addView(styleView);
    this.$el.append(styleView.render().el);

    var itemsView = new InfowindowContentHoverItemsView({
      layerTableModel: this._layerTableModel,
      layerInfowindowModel: this._layerInfowindowModel
    });
    this.addView(itemsView);
    this.$el.append(itemsView.render().el);

    return this;
  }

});
