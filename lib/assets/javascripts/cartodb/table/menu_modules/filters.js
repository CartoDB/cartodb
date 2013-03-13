

cdb.admin.mod.Filters = cdb.core.View.extend({

    buttonClass: 'filters_mod',
    className: 'filters_panel',
    type: 'tool',

    initialize: function() {
      var self = this;
      this._filterViews = {};
      this.filters = new cdb.admin.models.Filters();
      this.columns = new cdb.core.Model();

      this.add_related_model(this.filters);
      this.add_related_model(this.columns);
      this.add_related_model(this.options.table);

      this.newFilterSelector = new cdb.forms.Combo({
        model: this.columns,
        extra: this.options.table.columnNames(),
        property: 'column'
      });

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

      this._filtersChanged = _.debounce(this._filtersChanged, 200);
      this.filters.bind('add', this._addFilter, this);
      this.filters.bind('remove', this._removeFilter, this);
      this.filters.bind('change add remove', this._filtersChanged, this);

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
      this.$el.html(this.getTemplate('table/menu_modules/views/filters'));
      this.$('.content').append(this.newFilterSelector.render().el);
      return this;
    }

});

