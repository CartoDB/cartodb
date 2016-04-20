var cdb = require('cartodb.js');
var InfowindowContentHoverStyleView = require('./infowindow-style-view');
var InfowindowContentHoverItemsView = require('./infowindow-items-view');

/**
 * Select for a Widget definition type.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
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
    });
    this.addView(itemsView);
    this.$el.append(itemsView.render().el);

    return this;
  }

});
