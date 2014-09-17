
  /**
   *  Tables from a tag view in common data content
   *
   *  - When a tag is selected, all tables from that tag
   *    will be showed.
   *
   */

  cdb.admin.CommonData.TablesTag = cdb.core.View.extend({

    initialize: function() {
      this.user = this.options.user;
      this.router = this.options.router;
      this.tags = this.options.tags;
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
        if (table.get('category') && tag === table.get('category')) {
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
      var mdl = _.first(this.tags.where({ name: this.router.model.get('tag') }));
      
      if (mdl) {
        var title = new cdb.admin.CommonData.Title({
          model: mdl
        });
        this.$el.append(title.render().el);
        this.addView(title);
      }
    },

    _onTableChosen: function(url, v) {
      this.trigger('tableChosen', url, this);
    }

  });