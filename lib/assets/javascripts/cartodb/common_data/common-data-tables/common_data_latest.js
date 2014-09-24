
  /**
   *  Latest data tables for common data section
   *
   */

  cdb.admin.CommonData.TablesLatest = cdb.core.View.extend({

    _MAX_ITEMS: 5,

    initialize: function() {
      this.user = this.options.user;
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
      this[ this.router.model.get('latest') ? 'show' : 'hide' ]();

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
      this.collection.each(function(table, i){
        if (table.get('category') && i < self._MAX_ITEMS) {
          var table_view = new cdb.admin.CommonData.Table({
            model: table,
            user: self.user
          });
          table_view.bind('tableChosen', self._onTableChosen, self);
          self.$('ul.tables').append(table_view.render().el);
          self.addView(table_view);
        }
      })
    },

    _renderTitle: function() {
      var mdl = new cdb.admin.CommonData.CategoryModel({ name: 'Latest' });
      
      if (mdl) {
        var title = new cdb.admin.CommonData.Title({ model: mdl });
        this.$el.append(title.render().el);
        this.addView(title);
      }
      
    },

    _onTableChosen: function(url, v) {
      this.trigger('tableChosen', url, this);
    }

  })