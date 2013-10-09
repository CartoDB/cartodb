
  /**
   *  Combo for sync periods
   *  
   *  - Extra option parameter is not used and periods
   *    are set through static variable.
   */  
  
  cdb.forms.IntervalCombo = cdb.forms.Combo.extend({
    
    _PERIODS: [['Never', 0], ['Every hour', (60*60)], ['Every day', (60*60*24)], ['Every week', (60*60*24*7)], ['Every month', (60*60*24*30)]],

    initialize: function() {
      _.bindAll(this, "_onUpdate", "_changeSelection");

      this.data        = this._PERIODS;
      this.placeholder = this.options.placeholder || "";

      if (this.model) {
        this.add_related_model(this.model);
        this.model.bind("change:" + this.options.property, this._onUpdate);
      }
    }

  })

