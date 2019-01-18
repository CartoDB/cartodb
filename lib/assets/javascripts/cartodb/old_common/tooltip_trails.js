
  /**
   *  Tooltip that follows the mouse while dragging, you have
   *   to use jQuery UI lib to get events when dragging.
   */

  cdb.admin.TooltipTrails = cdb.core.View.extend({

    className: 'tooltip-trails',
    tagName: 'div',

    options: {
      msg: _t('Checking tooltip-trails'),
      offset: [15,5] // X,Y
    },

    render: function() {
      this.$el.append(this.options.msg);
      return this;
    },

    show: function(pos) {
      this.$el.css({
        'margin-left': this.options.offset[0],
        'margin-top': this.options.offset[1],
        'left':  pos.left,
        'top': pos.top
      })

      this.$el.show();
    },

    // Needs left and top object
    move: function(pos) {
      this.$el.css(pos);
    },

    hide: function() {
      this.$el.hide();
      this.clean();
    }

  })