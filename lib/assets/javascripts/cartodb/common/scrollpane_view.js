
  /**
   *  Default view for jScrollPane
   *
   *  - It needs the element of the view and the necessary
   *    options for the jscrollpane.
   *  - You can add gradients for the view.
   *
   */

  cdb.common.ScrollPane = cdb.core.View.extend({

    className: 'default-scrollpane',

    options: {
      gradients: false,
      timeout:   0,
      maxHeight: 154,
      jscrollpane_opts: {
        verticalDragMinHeight:  20,
        autoReinitialise:       true
      }
    },

    initialize: function() {
      if (!this.el) {
        cdb.log.info('Element is necessary to apply jscrollpane')
        return this;
      }
    },

    render: function() {
      this.clearSubViews();
      this._initViews();
      return this;
    },

    _initViews: function() {
      var self = this;

      // Set className
      this.$el.addClass(this.className);

      // Set max height
      this.$el.css('max-height', this.options.maxHeight);
      
      setTimeout(function(){
        // jScrollPane
        self.$el.jScrollPane(self.options.jscrollpane_opts);

        // Gradients
        if (self.options.gradients) {
          var gradients = new cdb.common.ScrollPaneGradient({
            list: self.$el
          });
          self.$el.append(gradients.render().el);
          self.addView(gradients);
        }

      }, this.options.timeout);
    },

    refresh: function() {
      this.render();
    },

    _destroyjScrollPane: function() {
      if (this.$el.data() != null) {
        this.$el.data().jsp && this.$el.data().jsp.destroy();
      }
    },

    clean: function() {
      this._destroyjScrollPane();
      cdb.core.View.prototype.clean.call(this);
    }

  })
  