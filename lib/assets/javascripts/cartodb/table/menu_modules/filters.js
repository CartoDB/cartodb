
cdb.admin.mod.Filters = cdb.core.View.extend({

    buttonClass: 'filters_mod',
    className: 'filters_panel',
    type: 'tool',

    initialize: function() {
      var self = this;
      this._filterViews = {};

      _.bindAll(this, "_loadScroll", "_refreshScroll");

      this.filters = new cdb.admin.models.Filters(null, {
        table: this.options.table
      });

      this.model = new Backbone.Model();

      this.excludedColumNames = [];

      this.columns = new cdb.core.Model();
      this.options.repeatInterval = this.options.repeatInterval || 200;

      this.add_related_model(this.filters);
      this.add_related_model(this.columns);
      this.add_related_model(this.options.table);
      this.add_related_model(this.options.dataLayer);

      this.columnSelector = new cdb.forms.ComboPro({
        width: '200px',
        placeholder: 'Select a column to filter by',
        data: this._generateComboData(),
        observe: 'column',
        model: self.columns
      });

      window.c  = self.columns;
      window.cs = this.columnSelector;

      // when SQL is cleared, remove filters
      this.options.dataLayer.bind('change:query', function(layer, sql) {
        if (!sql) {
          self.removeFilters();
        }
      }, this);

      this.columns.bind('change:column', function() {
        var col = this.columns.get('column');
        this.filters.add({
          column: col
        });
      }, this );

      if (this.options.repeatInterval > 0) {
        this._filtersChanged = _.debounce(this._filtersChanged, this.options.repeatInterval);
      }

      this.filters.bind('reset',                   this._addFilters,     this);
      this.filters.bind('add',                     this._addFilter,      this);
      this.filters.bind('remove',                  this._removeFilter,   this);
      this.filters.bind('change:items add remove', this._filtersChanged, this);

      var f = this.options.dataLayer.get('filters');

      if (f) {
        this.filters.reset(f);
      }

    },

    _generateComboData: function() {

      var self = this;

      var schema = this.options.table.get("schema");

      var allowedTypes = ["string", "number"];

      return _.filter(schema, function(field) {

        var
        name       = field[0],
        fieldType  = field[1];

        return _.contains(allowedTypes, fieldType) && !_.contains(self.excludedColumNames, name) && name != "cartodb_id";

      }).map(function(field) {

        var name = field[0];

        return [name, name];
      });

    },

    _loadScroll: function(n) {

      if (this.api || this.model.get("hasScroll")) return;

      var self = this;

      this.model.set("hasScroll", true);

      setTimeout(function() {

        var $scrollPane = self.$el.find(".scrollpane");

        $scrollPane.jScrollPane({ showArrows: true });
        self.api = $scrollPane.data('jsp');

      }, 250);

    },

    _refreshScroll: function(n) {

      if (!this.api || !this.model.get("hasScroll")) return;

      var self = this;

      setTimeout(function() {

        $(".scrollpane").animate({ height: $(".scrollpane .filters").height() + 40 }, { duration: 50, complete: function() {
          self.api.reinitialise();
        }});

      }, 100);

    },

    removeFilters: function() {
      this.filters.removeFilters();
    },

    _getFilterViewforColumnType: function(columnType) {
      if (columnType == 'number') {
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

      var self = this;

      if (!f.has('column_type')) throw "model should contain column_type";

      this.$el.find(".no_filters").hide();
      //this.$el.find(".form_combo").hide();

      var ViewClass = this._getFilterViewforColumnType(f.get('column_type'));

      var v = new ViewClass({ model: f });

      this.addView(v);

      this._filterViews[f.cid] = v;
      this.$('.filters').append(v.render().el);

      this._refreshScroll();

      this.excludedColumNames.push(f.get("column"));
      this.columnSelector.updateData(this._generateComboData());

    },

    _removeFilter: function(model) {

      var self = this;
      var view = this._filterViews[model.cid];

      view.$el.hide();
      view.clean();

      delete self._filterViews[model.cid];

      if (_.size(self._filterViews) < 1) {
        this.$el.find(".no_filters").show();
        this.$el.find(".form_combo").fadeIn(250);
      }

      this.excludedColumNames = _.without(this.excludedColumNames, model.get("column"));
      this.columnSelector.updateData(this._generateComboData());
      this.columnSelector.deselect();

      this._refreshScroll();

    },

    _filtersChanged: function() {

      // Serialize to layer
      this.options.dataLayer.set('filters', this.filters.toJSON());

      var sql;

      if (this.filters.size()) {

        sql = _.template("SELECT * FROM <%= table %> WHERE <%= cond %>")({
          table: this.options.table.get('name'),
          cond: this.filters.getSQLCondition()
        });

      }

      this.trigger('writeSQL', sql);

    },

    render: function() {

      var self = this;

      this.$el.html(this.getTemplate('table/menu_modules/filters/templates/filters'));
      this.$el.find('.content').append(this.columnSelector.render().el);

      if (this.filters.length == 0) {
        this.$el.find(".no_filters").show();
        this.$el.find(".form_combo").fadeIn(250);
      }

      this._addFilters();
      return this;
    }

});

