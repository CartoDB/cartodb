  
  /**
   *  Import sync info type
   *
   *  Sync module within import info view.
   *  It helps user to set syncing period.
   *
   *  - It doesn't need any model, it just creates one
   *    setting the period that user chooses.
   *  - Custom period enables "CRON" submenu (for the moment disabled).
   *
   *
   *  new cdb.admin.ImportInfo.Sync();
   *
   */

  cdb.admin.ImportInfo.Sync = cdb.core.View.extend({

    className:  'info sync',
    tagName:    'div',

    _DAYS:    [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
              17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],

    initialize: function() {
      this.template = cdb.templates.getTemplate('old_common/views/sync_selector');
      this.model = new cdb.core.Model({ period: 0 });
      this.render();

      // this.model.bind('change:period', this.render, this);
    },

    render: function() {
      this.clearSubViews();

      this.$el.html(this.template(this.model.toJSON()))

      this._renderPeriod();
      this._renderCustom();

      return this;
    },

    _renderPeriod: function() {
      // Period selector
      var period = new cdb.forms.IntervalCombo({
        el:       this.$('.period'),
        model:    this.model,
        property: 'period',
        width:    '108px'
      });

      period.bind('change', this._onChangePeriod, this);
      period.render();

      this.addView(period);
    },

    _renderCustom: function() {
      if (this.model.get('period') == "Custom") {
        // Day selector
        var day = new cdb.forms.Combo({
          el:       this.$('.day'),
          model:    this.model,
          property: 'day',
          width:    '40px',
          extra:    this._DAYS
        });

        day.bind('change', function(){ cdb.log.info('day changed') }, this);
        day.render();

        this.addView(day);
      }
    },

    _onChangePeriod: function(period) {
      this.trigger('periodChange', period);
    },

    setMessage: function() {},

    reset: function() {
      this.model.set('period', 0);
      this.model.unset('day');
      this.model.unset('time');
      this.render();
    }

  })
