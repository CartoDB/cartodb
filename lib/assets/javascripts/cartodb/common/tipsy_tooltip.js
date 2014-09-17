
  /** 
   *  Tipsy tooltip view.
   *  
   *  - Needs an element to work.
   *  - Inits tipsy library.
   *  - Clean bastard tipsy bindings easily.
   *
   */


  cdb.common.TipsyTooltip = cdb.core.View.extend({

    options: {
      gravity:  's',
      fade:     true
    },

    initialize: function(opts) {
      if (opts.el === undefined) {
        cdb.log.info('Element is needed to have tipsy tooltip working');
        return false;
      }

      this._initTipsy();
    },

    _initTipsy: function() {
      this.$el.tipsy(this.options);
    },

    _destroyTipsy: function() {
      var tipsy = this.$el.data('tipsy');
      if (tipsy) {
        // tipsy does not return this
        this.$el.tipsy('hide');
        this.$el.unbind('mouseleave mouseenter');
        this.$el.tipsy('remove');
      }
    },

    clean: function() {
      this._destroyTipsy();
      cdb.core.View.prototype.clean.call(this);
    }

  });
