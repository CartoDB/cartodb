
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

      index_tables.bind('tableChosen', this._onTableChosen, this);
      index_tables.render();
      this.addView(index_tables);

      // Tag view
      var tag_tables = new cdb.admin.CommonData.TablesTag({
        el: this.$('.tables-tag'),
        collection: this.collection,
        router: this.router
      });

      tag_tables.bind('tableChosen', this._onTableChosen, this);
      tag_tables.render();
      this.addView(tag_tables);

      // Latest view
      var latest_tables = new cdb.admin.CommonData.TablesLatest({
        el: this.$('.tables-latest'),
        collection: this.collection,
        router: this.router
      });

      latest_tables.bind('tableChosen', this._onTableChosen, this);
      latest_tables.render();
      this.addView(latest_tables);
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
    },

    _onTableChosen: function(url, v) {
      this.trigger('tableChosen', url, this);
    }

  });