
  /**
   *  Custom datepicker for CartoDB
   *
   *  
   */

  cdb.common.DatePicker = cdb.core.View.extend({

    _MAX_RANGE: 30,

    className: 'custom-datepicker',

    options: {
      flat: true,
      date: ['2008-07-31', '2008-07-31'],
      current: '2008-07-31',
      calendars: 2,
      mode: 'range',
      starts: 1
    },

    events: {
      'click a.dates': '_toggleCalendar'
    },

    initialize: function() {
      // Generate model
      this.model = new cdb.core.Model({
        fromDate: '',
        fromHour: 0,
        fromMin:  0,
        toDate: '',
        toHour: 23,
        toMin:  59,
        user_timezone: 0 // Explained as GMT+0
      });

      this.template = this.options.template || cdb.templates.getTemplate('old_common/views/custom_datapicker');

      // Init binds
      this._initBinds();

      // Set default dates
      this._setToday();
    },

    render: function() {
      var self = this;

      this.clearSubViews();

      this.$el.append(
        this.template(
          _.extend(
            this.model.attributes,
            { max_days: this._MAX_RANGE }
          )
        )
      );

      setTimeout(function() {
        self._initCalendar();
        self._hideCalendar();
        self._initTimers();
      }, 100);

      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onDatesChange', '_onDocumentClick');

      this.model.bind('change', this._setValues,      this);
      this.model.bind('change', this._onValuesChange, this);

      // Outside click
      $(document).bind('click', this._onDocumentClick);
    },

    _destroyBinds: function() {
      $(document).unbind('click', this._onDocumentClick);
    },

    _setValues: function(m, c) {
      var text = 'Choose your dates';
      var data = this.model.attributes;

      if (data.fromDate && data.toDate) {
        text =
          'From ' +
          '<em>' +
          this.model.get('fromDate') + ' ' +
          (cdb.Utils.pad(this.model.get('fromHour'),2) + ':' + cdb.Utils.pad(this.model.get('fromMin'),2)) +
          '</em>' +
          ' to ' + 
          '<em>' +
          this.model.get('toDate') + ' ' +
          (cdb.Utils.pad(this.model.get('toHour'),2) + ':' + cdb.Utils.pad(this.model.get('toMin'),2)) +
          '</em>';
      }

      this.$('.label').html(text);
    },

    _setToday: function() {
      var today = moment(new Date()).format("YYYY-MM-DD");
      var first = moment(new Date()).subtract( (this._MAX_RANGE - 1), 'days' ).format("YYYY-MM-DD");
      
      this.options.date = [first, today];
      this.options.current = today;

      this.model.set({
        fromDate: first,
        toDate: today
      });
    },

    _initCalendar: function() {
      var self = this;

      this.calendar = this.$('div.calendar div.datepicker').DatePicker(
        _.extend(this.options, {
          onChange: this._onDatesChange,
          onRender: function(d) { // Disable future dates and dates < 30 days ago

            var date = d.valueOf();
            var now = new Date();

            var thirtyDaysAgo = new Date(); 
            thirtyDaysAgo.setDate(now.getDate() - 30);

            return (date < thirtyDaysAgo) || (date > now) ? { disabled: true } : ''

          }
        })
      );
    },

    _onDatesChange: function(formatted, dates) {

      // Check if selected dates have more than 30 days
      var start = moment(formatted[0]);
      var end = moment(formatted[1]);

      if (Math.abs(start.diff(end, 'days')) > this._MAX_RANGE) {
        formatted[1] = moment(formatted[0]).add('days', this._MAX_RANGE).format("YYYY-MM-DD");
        this.$('div.calendar div.datepicker').DatePickerSetDate([formatted[0], formatted[1]]);
      }

      this.model.set({
        fromDate: formatted[0],
        toDate:   formatted[1]
      })
    },

    _hideCalendar: function(e) {
      if (e) this.killEvent(e);
      this.$('div.calendar').hide();
    },

    _toggleCalendar: function(e) {
      if (e) e.preventDefault();
      this.$('div.calendar').toggle();
    },


    _initTimers: function() {
      // 'From' div
      var $from = this.$('div.from');

      // From hour
      var fromHour = new cdb.forms.Spinner({
        model:    this.model,
        property: 'fromHour',
        min:      0,
        max:      23,
        inc:      1,
        width:    15,
        pattern:  /^([12]?\d{0,1}|3[01]{0,2})$/,
        debounce_time: 0
      });

      $from.find('.hour').append(fromHour.render().el);
      this.addView(fromHour);

      // From min
      var fromMin = new cdb.forms.Spinner({
        model:    this.model,
        property: 'fromMin',
        min:      0,
        max:      59,
        inc:      1,
        width:    15,
        pattern:  /^([12345]?\d{0,1})$/,
        debounce_time: 0
      });

      $from.find('.min').append(fromMin.render().el);
      this.addView(fromMin);


      // 'To' div
      var $to = this.$('div.to');

      // To hour
      var toHour = new cdb.forms.Spinner({
        model:    this.model,
        property: 'toHour',
        min:      0,
        max:      23,
        inc:      1,
        width:    15,
        pattern:  /^([12]?\d{0,1}|3[01]{0,2})$/,
        debounce_time: 0
      });

      $to.find('.hour').append(toHour.render().el);
      this.addView(toHour);

      // To min
      var toMin = new cdb.forms.Spinner({
        model:    this.model,
        property: 'toMin',
        min:      0,
        max:      59,
        inc:      1,
        width:    15,
        pattern:  /^([12345]?\d{0,1})$/,
        debounce_time: 0
      });

      $to.find('.min').append(toMin.render().el);
      this.addView(toMin);
    },

    _onValuesChange: function() {
      this.trigger('changeDate', this.model.toJSON(), this);
    },

    getDates: function() {
      return this.model.toJSON();
    },

    closeCalendar: function() {
      this.$('div.calendar').hide();
    },

    _onDocumentClick: function(e) {
      var $el = $(e.target);
      
      if ($el.closest('.custom-datepicker').length === 0) {
        this.closeCalendar();
      }
    },

    clean: function() {
      this._destroyBinds();
      this.closeCalendar();
      this.$('div.calendar div.datepicker').DatePickerHide();
      cdb.core.View.prototype.clean.call(this);
    }

  })
