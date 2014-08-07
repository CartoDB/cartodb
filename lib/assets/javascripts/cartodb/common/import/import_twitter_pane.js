
  /**
   *  Pane for import a tweets (only for Twitter GNIP)
   *
   *  new cdb.admin.ImportTwitterPane()
   */

  cdb.admin.ImportTwitterPane = cdb.admin.ImportPane.extend({
    
    className: "import-pane import-twitter-pane",

    initialize: function() {
      
      this.model = new cdb.core.Model({
        type:     'twitter',
        value:    '',
        interval: '0',
        valid:    false
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
      this.addView(categories);

      // Data picker
      var datapicker = new cdb.common.DatePicker();
      this.$('.twitter-date').append(datapicker.render().el);
      this.addView(datapicker);

      // Error pane

    }

  });
