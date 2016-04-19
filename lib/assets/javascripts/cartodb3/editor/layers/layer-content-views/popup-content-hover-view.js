var cdb = require('cartodb.js');
var PopupContentHoverStyleView = require('./popup-content-style-view');
var PopupContentHoverItemsView = require('./popup-content-items-view');

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
    var styleView = new PopupContentHoverStyleView({
    });
    this.addView(styleView);
    this.$el.append(styleView.render().el);

    var itemsView = new PopupContentHoverItemsView({
    });
    this.addView(itemsView);
    this.$el.append(itemsView.render().el);

    return this;
  }

});
