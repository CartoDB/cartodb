
  /**
   *  Show or hide desired white gradients in a
   *  scrolled list generated with jScrollPane.
   *
   *  cdb.common.ScrollPaneGradient({
   *    list: scrollpane element
   *  })
   *
   */

  cdb.common.ScrollPaneGradient = cdb.core.View.extend({

    initialize: function() {
      if (!this.options.list) {
        cdb.log.info("No Scrollpane list defined! -> options.list")
      }

      this.$scrollpane = this.options.list; 
      this._initBinds();
    },

    render: function() {
      this.$el.append('<span class="top scroll"></span><span class="bottom scroll"></span>');
      return this;
    },

    _initBinds: function() {
      _.bindAll(this, 'checkScroll');
      this.$scrollpane.bind('jsp-scroll-y', this.checkScroll);
      this.$scrollpane.bind('jsp-scroll-x', this.checkScroll);
    },

    _destroyBinds: function() {
      this.$scrollpane.unbind('jsp-scroll-y', this.checkScroll);
      this.$scrollpane.unbind('jsp-scroll-x', this.checkScroll);
    },

    checkScroll: function(e, scrollPositionY, isAtTop, isAtBottom) {
      var $top = this.$('span.top');
      var $bottom = this.$('span.bottom');

      if (isAtTop) {
        $top.hide();
      } else {
        $top.show();
      }

      if (isAtBottom) {
        $bottom.hide();
      } else {
        $bottom.show();
      }
    },

    clean: function() {
      this._destroyBinds();
      cdb.core.View.prototype.clean.call(this);
    }

  });

