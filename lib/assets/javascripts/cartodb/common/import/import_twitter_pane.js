
  /**
   *  Pane for import a tweets (only for Twitter GNIP)
   *
   *  new cdb.admin.ImportTwitterPane()
   */

  cdb.admin.ImportTwitterPane = cdb.admin.ImportPane.extend({
    
    className: "import-pane import-twitter-pane",

    _TEXTS: {
      error: _t('Date range has to be before today and at least one category is required')
    },

    initialize: function() {

      this.user = this.options.user;
      
      this.model = new cdb.core.Model({
        type:             'service',
        service_name:     'twitter',
        value:            {},
        service_item_id:  {},
        interval:         '0',
        valid:            false
      });

      this.template = cdb.templates.getTemplate(this.options.template || 'common/views/import/import_twitter');

      this.render();

      this._initBinds();
    },

    render: function() {
      this.clearSubViews();

      this.$el.append( this.template( this.user.get('twitter') ) );

      this._initViews();

      return this;
    },

    _initViews: function() {

      // Categories
      var categories = new cdb.common.TwitterCategories();
      categories.bind('changeCategory', this._onCategoriesChange, this);
      categories.bind('submitCategory', this._onSubmit, this);
      this.$('.twitter-categories').append(categories.render().el);
      this.addView(categories);

      // Date picker
      var datepicker = this.datepicker = new cdb.common.DatePicker();
      datepicker.bind('changeDate', this._onDateChange, this);
      this.$('.twitter-date').append(datepicker.render().el);
      this.addView(datepicker);
      // *Set datepicker values from the beginning*
      this._onDateChange(datepicker.getDates());
      
      // Error pane
      this.error_info = new cdb.admin.ImportInfo({
        el:     this.$('div.infobox'),
        model:  this.model
      });
      this.addView(this.error_info);

    },

    _initBinds: function() {
      this.model.bind('change', this._onValueChange, this);
    },

    _onCategoriesChange: function(categories, v) {
      var d = this.model.get('value');
      
      // Get only completed categories
      d.categories = _.filter(categories, function(c) {
        return c.category && c.terms.length > 0
      });

      // Set same value for value and service_item_id
      this.model.set({
        value:            d,
        service_item_id:  d
      })

      this._checkValid();
    },

    _onDateChange: function(m, v) {
      var d = this.model.get('value');
      d.dates = m;

      // Set same value for value and service_item_id
      this.model.set({
        value:            d,
        service_item_id:  d
      })

      this._checkValid();
    },

    _onValueChange: function() {
      this.trigger('valueChange', this.model.toJSON(), this);
    },

    _onSubmit: function() {
      if (this.model.get('valid')) {
        this.trigger('fileChosen', this.model.toJSON());
      } else {
        this.error_info.activeTab('error', this._TEXTS.error);
      }
      this.datepicker.closeCalendar();
    },

    _checkValid: function() {
      var categories = this.model.get('value').categories;
      var dates = this.model.get('value').dates;
      var isToDateValid = moment(dates.fromDate) <= moment(new Date());
      var valid = categories &&
                  categories.length > 0 &&
                  dates && dates.fromDate && dates.toDate &&
                  isToDateValid;
      
      this.model.set('valid', valid);
    }

  });
