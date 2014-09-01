
  /**
   *   
   *
   *
   */

  cdb.admin.CommonData.TablesTag = cdb.core.View.extend({

    initialize: function() {
      this.router = this.options.router;
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();
      this.$el.empty();

      // Render tag title
      this._renderTitle();
      // Render desired tables
      this._renderTables();
      // Visibility
      this[ this.router.model.get('tag') ? 'show' : 'hide' ]();

      return this;
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
      this.router.model.bind('change', this.render, this);
      this.add_related_model(this.router.model);
    },

    _renderTables: function() {
      var self = this;

      // Create list
      this.$el.append($('<ul>').addClass('tables'));

      // Append items
      this.collection.each(function(table){
        var tag = self.router.model.get('tag');
        if (table.get('tags') && tag === table.get('tags')[0]) {
          var table_view = new cdb.admin.CommonData.Table({ model: table });
          self.$('ul.tables').append(table_view.render().el);
          self.addView(table_view);
        }
      })
    },

    _renderTitle: function() {
      var title = new cdb.admin.CommonData.Title({ model: this.router.model });
      this.$el.append(title.render().el);
      this.addView(title);
    }

  });