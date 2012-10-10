/**
 * Custom scroll for blocks
 */

cdb.admin.CustomScrolls = cdb.core.View.extend({

  events: {
    'scroll': '_checkScroll'
  },

  initialize: function() {
    this.render();
    this._checkScroll();
  },

  render: function() {
    this.$el
      .parent()
      .append('<span class="top scroll"></span><span class="bottom scroll"></span>');
  },

  _checkScroll: function(ev) {
    var height_ = this.$el.outerHeight()
      , scroll_y = this.$el[0].scrollTop
      , scroll_x = this.$el[0].scrollLeft
      , scroll_y_height = this.$el[0].scrollHeight - height_
      , $parent = this.$el.parent()
      , $top = $parent.find('span.top')
      , $bottom = $parent.find('span.bottom');

    // Y axis for the moment
    if (scroll_y == 0) {
      $top.hide();
    } else {
      $top.show();
    }

    if (scroll_y == scroll_y_height) {
      $bottom.hide();
    } else {
      $bottom.show();
    }
  }

});
