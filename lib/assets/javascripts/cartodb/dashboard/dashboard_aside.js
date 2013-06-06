cdb.admin.dashboard.Aside = cdb.core.View.extend({

  initialize: function() {

    this.model      = new cdb.core.Model();
    this.model.bind('change:visible', this._toggleVisibility, this);

  },

  _toggleVisibility: function() {
    if (this.model.get("visible")) this._show();
    else this._hide();
  },

  _show: function() {
    this.$el.css("display", "inline-block");
    this.$el.animate({opacity: 1}, { duration: 250 });
  },

  _hide: function() {
    this.$el.animate({opacity: 0}, { duration: 250, complete: function() {
      $(this).hide();
    }});
  },

  scroll: function(ev) {

    var $aside    = this.$el
    , $list       = this.$el.prev("section")
    , scrolled    = $(ev.target).scrollTop()
    , aside_h     = $aside.outerHeight()

    if ($list.length <= 0) return; // Don't keep going if we don't have the list

    var list_pos  = $list.offset().top
    , list_height = $list.outerHeight();

    if ( scrolled > list_pos ) {
      if ((scrolled + aside_h) < (list_pos + list_height)) {
        $aside
        .addClass("moving")
        .css({
          marginTop: - list_pos
        })
        .removeClass("bottom");
      } else {
        $aside
        .addClass("bottom")
        .removeClass("moving")
        .css({
          marginTop: list_height - aside_h
        })
      }
    } else {
      $aside
      .removeClass("moving bottom")
      .css({
        marginTop: 0
      })
    }
  },

  render: function() {
    return this;
  }

});
