
  /**
   *  Pane for import a tweets (only for Twitter GNIP)
   *
   *  new cdb.admin.ImportTwitterPane()
   */

  cdb.admin.ImportTwitterPane = cdb.admin.ImportPane.extend({
    
    className: "import-pane import-twitter-pane",

    initialize: function() {
      
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
    },

    render: function() {
      this.clearSubViews();

      this.$el.append(this.template());

      this._initViews();

      return this;
    },

    _initViews: function() {

      // Categories
      var categories = new cdb.common.TwitterCategories();
      this.$('.twitter-categories').append(categories.render().el);
      categories.bind('changeCategory', this._onCategoriesChange, this);
      categories.bind('submitCategory', this._onSubmit, this);
      this.addView(categories);

      // Date picker
      var datepicker = new cdb.common.DatePicker();
      this.$('.twitter-date').append(datepicker.render().el);
      this.bind('changeDate', this._onDateChange, this);
      this.addView(datepicker);

      // Error pane
      var info = new cdb.admin.ImportInfo({
        el:     this.$('div.infobox'),
        model:  this.model
      });
      this.addView(info);

    },

    _onCategoriesChange: function(m, v) {

    },

    _onDateChange: function(m, v) {

    },

    _onValueChange: function() {
      this.trigger('valueChange', this.model.toJSON(), this);
    },

    _onSubmit: function() {
      if (this.model.get('valid')) {
        this.trigger('fileChosen', this.model.toJSON());
      } else {
        this.import_info.activeTab('error', this._TEXTS.error);
      }
    }

  });
