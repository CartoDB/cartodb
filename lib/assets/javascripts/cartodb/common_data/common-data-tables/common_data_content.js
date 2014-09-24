
  /**
   *  Main content for common data section
   *
   *  It could be:
   *     
   *  - Index view
   *  - Tag view
   *  - Latest view
   *
   */


  cdb.admin.CommonData.Content = cdb.core.View.extend({

    initialize: function() {
      this.user = this.options.user;
      this.router = this.options.router;
      this.collection = new cdb.admin.CommonData.DatasetsCollection();
      this.categories = new cdb.admin.CommonData.CategoriesCollection();
      this.template = cdb.templates.getTemplate('common_data/views/common_data_content');
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();
      this.$el.html(this.template());

      // Init views
      this._initViews();

      // Show or hide it!
      this[ this.collection.size() > 0 ? 'show' : 'hide' ]();

      return this;
    },

    _initViews: function() {
      // Index view
      var index_tables = new cdb.admin.CommonData.TablesIndex({
        el: this.$('.tables-index'),
        collection: this.collection,
        user: this.user,
        tags: this.categories,
        router: this.router
      });

      index_tables.bind('tableChosen', this._onTableChosen, this);
      index_tables.render();
      this.addView(index_tables);

      // Tag view
      var tag_tables = new cdb.admin.CommonData.TablesTag({
        el: this.$('.tables-tag'),
        collection: this.collection,
        user: this.user,
        tags: this.categories,
        router: this.router
      });

      tag_tables.bind('tableChosen', this._onTableChosen, this);
      tag_tables.render();
      this.addView(tag_tables);

      // Latest view
      var latest_tables = new cdb.admin.CommonData.TablesLatest({
        el: this.$('.tables-latest'),
        collection: this.collection,
        user: this.user,
        router: this.router
      });

      latest_tables.bind('tableChosen', this._onTableChosen, this);
      latest_tables.render();
      this.addView(latest_tables);
    },

    _initBinds: function() {
      this.model.bind('change:datasets', this._onDatasetsChange, this);
    },

    _onDatasetsChange: function() {
      this.collection = this.model.get('datasets');
      this.categories = this.model.get('categories');
      this.render();
    },

    _onTableChosen: function(url, v) {
      this.trigger('tableChosen', url, this);
    }

  });