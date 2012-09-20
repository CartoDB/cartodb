/**
 *  Edit Date dialog, comes from Small Dialog -> cell editor!
 *  Associate templates:
 *    - dialog_small_edit
 *    - date_editor
 */

cdb.admin.EditDateDialog = cdb.admin.SmallDialog.extend({

  className: "floating edit_text_dialog date_dialog",

  events: cdb.core.View.extendEvents({
    'keyup input[type="text"]': '_keyPress'
  }),

  initialize: function() {
    _.defaults(this.options, {
      template_name: 'common/views/dialog_small_edit',
      ok_title: 'Save',
      modal_class: 'edit_text_dialog',
      clean_on_hide: true
    });

    // Set flag when time fails or is OK
    this.enable = true;

    // Generate model
    this.model = new Backbone.Model();    

    // Super!
    cdb.ui.common.Dialog.prototype.initialize.apply(this);

    // Render
    this.render();

    // Add the dialog to the body
    $(document.body).find("div.table table").append(this.el);

    // Init widgets
    this._initWidgets();
  },


  /**
   *  Render content
   */
  render_content: function() {
    var date = this._splitDate(this.options.initial_value || '');

    this.model.set(date);

    var template = cdb.templates.getTemplate("table/cell_editors/views/date_editor")
      , $content = this.$content = $("<div>").append(template(this.model.toJSON()));

    return $content;
  },


  /**
   *  Init the widgets
   */
  _initWidgets: function() {

    // Days spinner
    var days = this.days = new cdb.forms.Spinner({
      el: this.$el.find('div.day'),
      model: this.model, 
      property: 'day',
      min: 1,
      max: 31,
      inc: 1,
      width: 15,
      pattern: /^([12]?\d{0,1}|3[01]{0,2})$/
    });
    this.addView(this.days);
    this.$content.find("div.day").append(days.render());

    // Year spinner
    var years = this.years = new cdb.forms.Spinner({
      el: this.$el.find('div.year'),
      model: this.model, 
      property: 'year',
      min: 1900,
      max: 2100,
      width: 28,
      pattern: /^([0-9]{0,4})$/
    });
    this.addView(this.years);
    this.$content.find("div.year").append(years.render());

    // Month selector
    var months = this.months = new cdb.forms.Combo({
      el: this.$el.find('div.month'),
      model: this.model,
      property: 'month',
      width: '140px',
      extra: [['January',1], ['February',2], ['March',3], ['April',4], ['May',5], ['June',6], ['July',7], ['August',8], ['September',9], ['October',10], ['November',11], ['December',12]]
    });
    this.addView(this.months);
    this.$content.find("div.month").append(months.render());
  },


  /**
   *  Split the date string
   */
  _splitDate: function(str) {
    var date = {};
  
    if (str=='') {
      date.day = 1;
      date.month = 1;
      date.year = 2012;
      date.time = '00:00:00';
    } else {
      try {
        var split_date_hour = str.split('T');
        if (split_date_hour.length>1) {
          var split_date = split_date_hour[0].split('-');
          date.time = split_date_hour[1].split('+')[0];
          date.day = parseInt(split_date[2]);
          date.month = parseInt(split_date[1]);
          date.year = parseInt(split_date[0]);
        } else {
          date.day = 1;
          date.month = 1;
          date.year = 2012;
          date.time = '00:00:00';
        }
      } catch (e) {
        date.day = 1;
        date.month = 1;
        date.year = 2012;
        date.time = '00:00:00';
      }
    }
    return date;
  },


  /**
   *  Get the date model and converts to date string
   */
  _toDate: function(date) {
    return date.year + "-" + date.month + "-" + date.day + "T" + date.time + "+02:00"
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


  /**
   *  Check the time everytime user press the key
   */
  _keyPress: function(ev) {
    var time = $(ev.target).val();

    if (this._checkTime(time)) {
      this.enable = true;
      this.model.set({"time": time}, {silent:true});
      $(ev.target).removeClass("error");

      if(ev.keyCode === 13) {
        this._ok();
      }
    } else {
      $(ev.target).addClass("error");
      this.enable = false;
    }
  },


  /**
   *  Overwrite the show function
   */
  showAt: function(x, y, width, fix) {

    var dialog_width = this.$el.width();

    this.$el.css({
      top: y,
      left: x + (width - dialog_width) / 2,
      minWidth: dialog_width,
      maxWidth: dialog_width
    });

    this.show();
  },


  /**
   *  Ok button function
   */
  _ok: function(ev) {
    if(ev) ev.preventDefault();

    // If the time is not ok, the dialog is not correct
    if (!this.enable) {
      return false;
    }

    if (this.ok) {
      this.ok();
    }

    this.hide();
  },


  /**
   *  Ok button function
   */
  ok: function(ev) {
    if(this.options.res) {
      this.options.res(this._toDate(this.model.toJSON()));
    }
  }
});