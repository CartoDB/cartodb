
  /**
   *
   *
   *
   */

  cdb.admin.CommonData.TablesIndex = cdb.core.View.extend({

    _MAX_CATEGORIES: 3,
    _MAX_TABLES: 4,

    initialize: function() {
      this.tags = this.options.tags;
      this.router = this.options.router;
      this._initBinds();
    },
    
    render: function() {
      this.clearSubViews();
      this.$el.empty();

      // Render all desired categories (up to 3)
      this._renderCategories();
      // Visibility
      this[ !this.router.model.get('tag') && !this.router.model.get('latest') ? 'show' : 'hide' ]();

      return this;
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
      this.router.model.bind('change', this.render, this);
      this.tags.bind('change add remove reset', this.render, this);
      this.add_related_model(this.router.model);
      this.add_related_model(this.tags);
    },

    _renderCategories: function() {
      var self = this;
      
      // First 3 tags, up to 4 tables, then extra link
      this.tags.each(function(t,i) {
        
        if (i < self._MAX_CATEGORIES) {
          self._renderTitle(t.get('value'), i !== 0 ? true : false );
          self._renderTables(t.get('value'));
          if (t.get('count') > self._MAX_TABLES) {
            self._renderViewAll(t);  
          }
        }

      })
    },

    _renderTables: function(category) {
      var self = this;

      // Create list
      this.$el.append($('<ul>').addClass(cdb.Utils.sanitizeString(category)));

      // Append items
      var c = 0;
      this.collection.each(function(table, i){
        if (table.get('tags') && category === table.get('tags')[0] && c < self._MAX_TABLES) {
          var table_view = new cdb.admin.CommonData.Table({ model: table });
          self.$('ul.' + cdb.Utils.sanitizeString(category)).append(table_view.render().el);
          self.addView(table_view);
          c++;
        }
      })
    },

    _renderTitle: function(tag, margin) {
      var title = new cdb.admin.CommonData.Title({
        model: new cdb.core.Model({ tag: tag }),
        className: margin ? 'margin' : ''
      });
      this.$el.append(title.render().el);
      this.addView(title);
    },

    _renderViewAll: function(mdl) {
      var view_all = new cdb.admin.CommonData.ViewAll({ model: mdl, router: this.router });
      this.$el.append(view_all.render().el);
      this.addView(view_all);
    },

    _onRouterChange: function() {
      this.render();
      this[ !this.router.model.get('tag') && !this.router.model.get('latest') ? 'show' : 'hide' ]();
    }

  })