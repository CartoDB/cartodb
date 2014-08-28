
  /**
   *  
   *
   *
   */


  cdb.admin.CommonData.Content = cdb.core.View.extend({

    initialize: function() {
      this.router = this.options.router;
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

      // Tag view
      var tag_tables = new cdb.admin.CommonData.TablesTag({
        el: this.$('.tables-tag'),
        collection: this.collection,
        router: this.router
      })

      tag_tables.render();
      this.addView(tag_tables);
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
    }

  });