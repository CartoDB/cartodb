

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
      this.add_related_model(this.options.dataLayer);

      var extra = _.filter(this.options.table.get("schema"), function(c) { return (c[1] == "string" || (c[1] == "number") && c[0] != "cartodb_id"); }).map(function(c) {
        return c[0];
      });

      this.newFilterSelector = new cdb.forms.Combo({
        model: this.columns,
        extra: extra,
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

      var self = this;

      if (!f.has('column_type')) throw "model should contain column_type";

      $(".no_filters").hide();

      var ViewClass = this._getFilterViewforColumnType(f.get('column_type'));

      var v = new ViewClass({ model: f });

      this.addView(v);

      this._filterViews[f.cid] = v;
      this.$('.filters').append(v.render().el);

    },

    _removeFilter: function(model) {

      var self = this;
      var view = this._filterViews[model.cid];

      view.$el.hide();
      view.clean();

      delete self._filterViews[model.cid];

      if (_.size(self._filterViews) < 1) $(".no_filters").show();

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
      this.$el.html(this.getTemplate('table/menu_modules/filters/templates/filters'));
      this.$('.content').append(this.newFilterSelector.render().el);
      return this;
    }

});

