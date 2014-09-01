
  /**
   *  
   *
   *
   */


  cdb.admin.CommonData.Content = cdb.core.View.extend({

    initialize: function() {
      this.router = this.options.router;
      this.tags = this.options.tags;
      this.template = cdb.templates.getTemplate('common_data/views/common_data_content');
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();
      this.$el.html(this.template());

      // Init views
      this._initViews();

      return this;
    },

    _initViews: function() {
      // Index view
      var index_tables = new cdb.admin.CommonData.TablesIndex({
        el: this.$('.tables-index'),
        collection: this.collection,
        tags: this.tags,
        router: this.router
      });

      index_tables.render();
      this.addView(index_tables);

      // Tag view
      var tag_tables = new cdb.admin.CommonData.TablesTag({
        el: this.$('.tables-tag'),
        collection: this.collection,
        router: this.router
      });

      tag_tables.render();
      this.addView(tag_tables);

      // Latest view
      var latest_tables = new cdb.admin.CommonData.TablesLatest({
        el: this.$('.tables-latest'),
        collection: this.collection,
        router: this.router
      });

      latest_tables.render();
      this.addView(latest_tables);
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
    }

  });