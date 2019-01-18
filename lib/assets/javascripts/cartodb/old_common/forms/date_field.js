
  /**
   *  Date field -> Place to choose and edit date field
   *  - It accepts a model with {attribute: 'colum', value: '2013-02-12T12:19:58+01:00'}
   *  - It will create a new model to split this value into {day, month, year and time}
   *  var date = new cdb.admin.DateField({ model: model })
   */

  cdb.admin.DateField = cdb.admin.StringField.extend({

    className: 'field date',

    timezone: "00:00",

    default_options: {
      template_name: 'old_common/views/forms/date_field',
      label:          false,
      readOnly:       false
    },

    events: {
      'change input.time': '_onChange',
      'keyup input.time':  '_onKeyUp'
    },

    initialize: function() {
      _.defaults(this.options, this.default_options);

      _.bindAll(this, '_onChange', '_onKeyUp', '_onChangeModel');

      this.template_base = this.options.template_base ? _.template(this.options.template_base) : cdb.templates.getTemplate(this.options.template_name);

      // Get date
      var date = this._splitDate((this.model.get('value')));

      this.timezone = this._getTimeZone(this.model.get('value'));

      // Generate a new date Model (later it will be removed and destroyed)
      this.date_model = new cdb.core.Model();

      // Begins as valid
      this.valid = true;

      // Bind changes
      this.date_model.bind('change', this._onChangeModel);

      // Date model data set
      this.date_model.set(date);

      // On clean
      this.bind('clean', this._reClean);
    },

    render: function() {
      this.$el.html(this.template_base(_.extend(this.model.toJSON(), this.options)));

      // Apply views
      this._initViews();

      // Check readOnly and unbind all events
      if (this.options.readOnly) {
        this.undelegateEvents();
      }

      return this;
    },

    _initViews: function() {

      // Days spinner
      var days = this.days = new cdb.forms.Spinner({
        el: this.$el.find('div.day'),
        model:    this.date_model,
        disabled: this.options.readOnly,
        property: 'day',
        min:      1,
        max:      31,
        inc:      1,
        width:    15,
        noSlider: true,
        pattern:  /^([12]?\d{0,1}|3[01]{0,2})$/
      });

      this.addView(this.days);
      this.$("div.day").append(days.render());

      // Year spinner
      var years = this.years = new cdb.forms.Spinner({
        el: this.$el.find('div.year'),
        model:    this.date_model,
        disabled: this.options.readOnly,
        property: 'year',
        min:      1900,
        max:      2100,
        width:    28,
        noSlider: true,
        pattern:  /^([0-9]{0,4})$/
      });
      this.addView(this.years);
      this.$("div.year").append(years.render());

      // Month selector
      var months = this.months = new cdb.forms.Combo({
        el: this.$el.find('div.month'),
        model:      this.date_model,
        disabled:   this.options.readOnly,
        property:   'month',
        width:      '140px',
        extra:      [['January',1], ['February',2], ['March',3], ['April',4], ['May',5], ['June',6], ['July',7], ['August',8], ['September',9], ['October',10], ['November',11], ['December',12]]
      });
      this.addView(this.months);
      this.$("div.month").append(months.render());

      // Time input
      this.$('input.time').val(this.date_model.get('time'));
    },

    /**
     *  Extracts the timezone from a date
     */
    _getTimeZone: function(date) {

      if (date) {
        var match = date.match(/\+(.*)$/);
        if (match && match.length == 2) return match[1];
      }

      return this.timezone;

    },

    /**
     *  Split the date string
     */
    _splitDate: function(str) {
      var date = {};

      // Get default date and time
      var today = new Date();

      var day   = today.getDate();
      var month = today.getMonth() + 1;
      var year  = today.getFullYear();

      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

      if (str == '') {
        date.day   = day;
        date.month = month;
        date.year  = year;
        date.time  = time;
      } else {
        try {
          var split_date_hour = str.split('T');

          if (split_date_hour.length > 1) {

            var split_date = split_date_hour[0].split('-');

            date.time  = split_date_hour[1].substr(0,8);
            date.day   = parseInt(split_date[2]);
            date.month = parseInt(split_date[1]);
            date.year  = parseInt(split_date[0]);

          } else {
            date.day   = day;
            date.month = month;
            date.year  = year;
            date.time  = time;
          }

        } catch (e) {
          date.day   = day;
          date.month = month;
          date.year  = year;
          date.time  = time;
        }
      }

      return date;

    },

    /**
     *  Get the date model and converts to date string
     */
    _toDate: function(date) {
      return date.year + "-" + date.month + "-" + date.day + "T" + date.time + "+" + this.timezone;
    },

    /**
     *  Check if the time is well formed or not
     */
    _checkTime: function(time) {
      var pattern = /^([01]{1}[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (pattern.test(time)) {
        return true
      } else {
        return false
      }
    },


    // Events
    _onChange: function(e) {
      var time = this.$('input.time').val();

      if (this._checkTime(time)) {
        this.date_model.set('time', time);
      }
    },

    _onChangeModel: function(m) {
      this.model.set('value', this._toDate(this.date_model.toJSON()));
    },


    _onKeyDown: function() {},


    _onKeyUp: function(e) {
      var time = $(e.target).val();

      if (this._checkTime(time)) {

        if (e.keyCode === 13) {
          e.preventDefault();
          this._triggerEvent('ENTER');
          return false;
        }

        this.valid = true;
        this.date_model.set('time', time);
        $(e.target).removeClass("error");
      } else {
        this.valid = false;
        $(e.target).addClass("error");
      }
    },

    _reClean: function() {
      this.date_model.unbind('change');
      this.date_model.destroy();
    }
  })
