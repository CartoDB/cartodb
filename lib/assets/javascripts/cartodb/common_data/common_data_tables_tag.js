
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

      return this;
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
      this.router.model.bind('change', this._onRouterChange, this);
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

    },

    _onRouterChange: function() {
      this.render();
      this[ this.router.model.get('tag') ? 'show' : 'hide' ]();
    }

  });