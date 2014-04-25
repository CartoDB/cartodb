/**
 *  Custom scroll for blocks
 *  - el: scrollable element
 *  - parent: where to put span shadows :)
 */

cdb.admin.CustomScrolls = cdb.core.View.extend({

  events: {
    'scroll': 'checkScroll'
  },

  initialize: function() {
    var self = this;

    // Render it
    this.render();

    // Hack to check scroll form the beginning :)
    this.timeout = setTimeout(function(){
      self.checkScroll();
    },300)
  },

  render: function() {
    this.options.parent.append('<span class="top scroll"></span><span class="bottom scroll"></span>');
    return this;
  },

  checkScroll: function(ev) {
    var height_ = this.$el.outerHeight()
      , scroll_y = this.$el[0].scrollTop
      , scroll_x = this.$el[0].scrollLeft
      , scroll_y_height = this.$el[0].scrollHeight - height_
      , $parent = this.options.parent
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
