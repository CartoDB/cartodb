

cdb.admin.mod.Filters = cdb.core.View.extend({

    buttonClass: 'filters_mod',
    className: 'filters_panel',
    type: 'tool',

    initialize: function() {
      this._filterViews = {};
      this.filters = new cdb.admin.models.Filters();
      this.columns = new cdb.core.Model();

      this.add_related_model(this.filters);
      this.add_related_model(this.columns);

      this.newFilterSelector = new cdb.forms.Combo({
        model: this.columns,
        extra: this.options.table.columnNamesByType('number'),
        property: 'column'
      });

      this.columns.bind('change:column', function() {
        this.filters.add(new cdb.admin.models.Filter({
          column: this.columns.get('column'),
          table: this.options.table
        }));
      },this );

      this.filters.bind('add', this._addFilter, this);
      this.filters.bind('remove', this._removeFilter, this);
    },

    _addFilter: function(f) {
      var v = new cdb.admin.mod.Filter({
        model: f
      });
      this.addView(v);
      this._filterViews[f.cid] = v;
      this.$('.filters').append(v.render().el);
    },

    _removeFilter: function(model) {
      this._filterViews[model.cid].clean();
    },

    render: function() {
      this.$el.html(this.getTemplate('table/menu_modules/views/filters'));
      this.$('.content').append(this.newFilterSelector.render().el);
      return this;
    }

});

