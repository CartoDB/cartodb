
  /**
   *  Custom datepicker for CartoDB
   *
   *  
   */

  cdb.common.DatePicker = cdb.core.View.extend({

    className: 'custom-datepicker',

    options: {
      flat: true,
      date: [],
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
        fromHour: '00',
        fromMin:  '00',
        toDate: '',
        toHour: '23',
        toMin:  '59'
      });

      // Set current day
      this._setToday();

      // Init binds
      this._initBinds();

      this.template = this.options.template || cdb.templates.getTemplate('common/views/custom_datapicker');
    },

    render: function() {
      var self = this;

      this.clearSubViews();

      this.$el.append(this.template());

      setTimeout(function() {
        self._initCalendar();
        self._initTimers();
      }, 200);

      return this;
    },

    _initBinds: function() {
      this.model.bind('change', this._setValues, this);
    },

    _setValues: function(m, c) {
      var text = 'Choose your dates';
      var data = this.model.attributes;

      if (data.fromDate && data.toDate) {
        text =
          'From ' +
          '<em>' +
          this.model.get('fromDate') + ' ' +
          (this.model.get('fromHour') + ':' + this.model.get('fromMin')) +
          '</em>' +
          ' to ' + 
          '<em>' +
          this.model.get('toDate') + ' ' +
          (this.model.get('toHour') + ':' + this.model.get('toMin')) +
          '</em>';
      }

      this.$('.label').html(text);
    },

    _setToday: function() {
      var today = new Date();
      var date = today.getFullYear() + '-' + (today.getMonth()+1) + '-' +  today.getDate();
      
      this.options.dates = [date, date];
      this.options.current = today.getFullYear() + '-' + (today.getMonth()+1) + '-' +  today.getDate();
    },

    _toggleCalendar: function(e) {
      if (e) this.killEvent(e);
      this.$('div.calendar').toggle();
    },

    _initCalendar: function() {
      var self = this;

      this.$('div.calendar').DatePicker(
        _.extend(this.options, {
          onChange: function(formatted, dates) {
            
            self.model.set({
              fromDate: formatted[0],
              toDate: formatted[1]
            })

          }
        })
      );
    },

    _initTimers: function() {

      // From hour

      // var $div = $('<div>').addClass('fromHour');

      // var fromHour = new cdb.forms.Spinner({
      //   model:    this.model,
      //   property: 'fromHour',
      //   min:      0,
      //   max:      23,
      //   inc:      1,
      //   width:    15,
      //   pattern:  /^([12]?\d{0,1}|3[01]{0,2})$/
      // });

      // this.addView(fromHour);
      // $div.append(fromHour.render().el);

      // this.$('div.calendar .datepickerContainer tbody > tr > td:eq(0)').append($div);


      // var fromMin = new cdb.forms.Spinner({
      //   el:       this.$el.find('div.day'),
      //   model:    this.model,
      //   disabled: this.options.readOnly,
      //   property: 'day',
      //   min:      1,
      //   max:      31,
      //   inc:      1,
      //   width:    15,
      //   noSlider: true,
      //   pattern:  /^([12]?\d{0,1}|3[01]{0,2})$/
      // });

    },

    clean: function() {
      this.$('div.calendar').DatePickerClear();
      cdb.core.View.prototype.clean.call(this);
    }

  })