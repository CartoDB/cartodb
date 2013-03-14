

cdb.admin.mod.Filters = cdb.core.View.extend({

    buttonClass: 'filters_mod',
    className: 'filters_panel',
    type: 'tool',

    initialize: function() {
      var self = this;
      this._filterViews = {};
      this.filters = new cdb.admin.models.Filters();
      this.columns = new cdb.core.Model();
      this.options.repeatInterval = this.options.repeatInterval || 200;

      this.add_related_model(this.filters);
      this.add_related_model(this.columns);
      this.add_related_model(this.options.table);
      this.add_related_model(this.options.dataLayer);

      this.newFilterSelector = new cdb.forms.Combo({
        model: this.columns,
        extra: this.options.table.columnNames(),
        property: 'column'
      });

      // when sql is cleared, remove filters
      this.options.dataLayer.bind('change:query', function(layer, sql) {
        if(!sql) {
          this.filters.each(function(f) {
            f.destroy();
          });
        }
      }, this);

      this.columns.bind('change:column', function() {
        var col = this.columns.get('column');
        var column_type = this.options.table.getColumnType(col);
        var FilterClass = this._getFilterModelforColumnType(column_type);
        this.filters.add(new FilterClass({
          column: col,
          column_type: column_type,
          table: this.options.table
        }));


      },this );

      if(this.options.repeatInterval > 0) {
        this._filtersChanged = _.debounce(this._filtersChanged, this.options.repeatInterval);
      }

      this.filters.bind('reset', this._addFilters, this);
      this.filters.bind('add', this._addFilter, this);
      this.filters.bind('remove', this._removeFilter, this);
      this.filters.bind('change add remove', this._filtersChanged, this);

      var f = this.options.dataLayer.get('filters');
      if(f) {
        _(f).each(function(filter) {
          filter.table = self.options.table;
          filter.column_type = self.options.table.getColumnType(filter.column);
          var FilterClass = self._getFilterModelforColumnType(filter.column_type);
          self.filters.add(new FilterClass(filter));
        });
        //this.filters.reset(f);
      }

    },

    _getFilterModelforColumnType: function(columnType) {
      if(columnType == 'number') {
        return cdb.admin.models.Filter;
      } else {
        return cdb.admin.models.FilterDiscrete
      }
    },

    _getFilterViewforColumnType: function(columnType) {
      if(columnType == 'number') {
        return cdb.admin.mod.Filter;
      } else {
        return cdb.admin.mod.SelectorFilter;
      }
    },

    _addFilters: function() {
      var self = this;
      this.filters.each(function(f) { self._addFilter(f); });
    },

    _addFilter: function(f) {
      if(!f.has('column_type')) throw "model should contain column_type";
      var ViewClass = this._getFilterViewforColumnType(f.get('column_type'));
      var v = new ViewClass({
        model: f
      });
      this.addView(v);
      this._filterViews[f.cid] = v;
      this.$('.filters').append(v.render().el);
    },

    _removeFilter: function(model) {
      this._filterViews[model.cid].clean();
    },

    _filtersChanged: function() {
      // serialize to layer
      this.options.dataLayer.set('filters', this.filters.toJSON());
      var sql;
      if(this.filters.size()) {
        var sql = _.template("select * from <%= table %> where <%= cond %>")({
          table: this.options.table.get('name'),
          cond: this.filters.getSQLCondition()
        });
      }
      this.trigger('writeSQL', sql);
    },

    render: function() {
      var self = this;
      this.$el.html(this.getTemplate('table/menu_modules/views/filters'));
      this.$('.content').append(this.newFilterSelector.render().el);
      this.filters.each(function(f) {
        self._addFilter(f);
      });
      return this;
    }

});

