
cdb.admin.mod.Filters = cdb.core.View.extend({

    buttonClass: 'filters_mod',
    className: 'filters_panel',
    type: 'tool',

    events: {

      'click .add_filter .add'    : '_onClickAddFilter',
      'click .add_filter .remove' : '_onClickCloseFilter',
      'scroll' : '_onScroll'
    },

    _onToggleMode: function() {

      var mode = this.model.get("addMode");

      if (mode == "add")         this._showAddFilter();
      else if (mode == "combo")  this._showCombo();
      else if (mode == "hidden") this._hideAddFilter();

    },

    _hideAddFilter: function() {
      var self = this;

      this.$el.find(".add_filter > a.add, .add_filter > .combo").fadeOut(150);

    },

    _showAddFilter: function() {
      var self = this;

      this.$el.find(".add_filter > .combo").fadeOut(150, function() {
        self.$el.find(".add_filter a.add").fadeIn(150);
        self._refreshScroll();
      });

    },

    _showCombo: function() {
      var self = this;

      this.$el.find(".add_filter a.add").fadeOut(150, function() {
        self.$el.find(".add_filter > .combo").fadeIn(150);
        self._refreshScroll(function() {
          self._scrollBy(30);
        });

      });

    },

    _onClickCloseFilter: function(e) {

      e.preventDefault();
      e.stopPropagation();


      this.model.set("addMode", "add");


    },

    _onClickAddFilter: function(e) {
      e.preventDefault();
      e.stopPropagation();

      this.model.set("addMode", "combo");

    },

    _onScroll: function(e) {
      if (!this.api) return;
      var n = this.api.getPercentScrolledY();

      if (n <= 0) {
        this.$el.find(".white-gradient-shadow.main.top").css({ opacity: 0 });
      } else if (n == 1) {
        this.$el.find(".white-gradient-shadow.main.bottom").css({ opacity: 0 });
      } else {
        this.$el.find(".white-gradient-shadow.main.top").css({ opacity: 1 });
        this.$el.find(".white-gradient-shadow.main.bottom").css({ opacity: 1 });
      }

    },

    initialize: function() {
      var self = this;
      this._filterViews = {};

      _.bindAll(this, "loadScroll", "_refreshScroll");

      this.filters = new cdb.admin.models.Filters(null, {
        table: this.options.table
      });

      this.model = new Backbone.Model({
        defaults: {
          addMode: false
        }
      });

      this.excludedColumNames = [];

      this.columns = new cdb.core.Model();
      this.options.repeatInterval = this.options.repeatInterval || 200;

      this.add_related_model(this.filters);
      this.add_related_model(this.columns);
      this.add_related_model(this.options.table);
      this.add_related_model(this.options.dataLayer);

      var comboData = this._generateComboData();

      // Add combo boxes
      this.innerColumnSelector = new cdb.forms.Combo({
        width: '200px',
        placeholder: 'Select a column to filter by',
        extra: comboData,
        property: 'column',
        model: self.columns
      });

      this.columnSelector = new cdb.forms.Combo({
        width: '200px',
        placeholder: 'Select a column to filter by',
        extra: comboData,
        property: 'column',
        model: self.columns
      });

      this.options.table.bind("change:schema", this._onSchemaUpdate, this);

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

      // Filter bindings
      this.filters.bind('reset',                   this._addFilters,     this);
      this.filters.bind('add',                     this._addFilter,      this);
      this.filters.bind('remove',                  this._removeFilter,   this);
      this.filters.bind('change:items add remove', this._filtersChanged, this);
      this.filters.bind('change:lower',            this._filtersChanged, this);
      this.filters.bind('change:upper',            this._filtersChanged, this);
      this.filters.bind('change:free_text',        this._filtersChanged, this);
      this.filters.bind('change:list_view',        this._filtersChanged, this);

      this.model.bind('change:addMode',            this._onToggleMode, this);

      var f = this.options.dataLayer.get('filters');

      if (f) {
        this.filters.reset(f);
      }

    },

    _onSchemaUpdate: function() {

      // Update the combos
      var comboData = this._generateComboData();

      this.columnSelector.updateData(comboData);
      this.innerColumnSelector.updateData(comboData);

    },

    _generateComboData: function() {

      var self = this;

      var schema = this.options.table.get("original_schema");

      var allowedTypes = ["string", "number", "boolean"];

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

    loadScroll: function(n) {

      if (this.api || this.model.get("hasScroll")) return;

      var self = this;

      this.model.set("hasScroll", true);

      setTimeout(function() {

        var $scrollPane = self.$el.find(".scrollpane");
        $scrollPane.css("height", $(".filters_panel").outerHeight(true));
        $scrollPane.css("max-height", $(".filters_panel").outerHeight(true) - 60);

        $scrollPane.jScrollPane({ showArrows: true, animateScroll: true, animateDuration: 150 });
        self.api = $scrollPane.data('jsp');

      }, 250);

    },

    _scrollTo: function(y) {
      this.api.scrollToY(y);
    },

    _scrollBy: function(y) {
      this.api.scrollByY(y);
    },

    _refreshScroll: function(callback) {

      if (!this.api || !this.model.get("hasScroll")) return;

      var self = this;

      setTimeout(function() {

        self.api.reinitialise();
        callback && callback();

      }, 500);

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

      this.filters.each(function(f) {
        self._addFilter(f);
      });

    },

    _addFilter: function(column) {

      var self = this;

      if (!column.has('column_type')) { throw "model should contain column_type"; }

      this.$el.find(".chooser").hide();
      this.$el.find(".add_filter").show();

      var ViewClass = this._getFilterViewforColumnType(column.get('column_type'));

      var v = new ViewClass({ model: column });

      v.bind("refresh_scroll",   this._refreshScroll,    this);
      v.bind("scrollToPosition", this._scrollToPosition, this);

      this.addView(v);

      this._filterViews[column.cid] = v;
      this.$('.filters').append(v.render().el);

      this.excludedColumNames.push(column.get("column"));

      var comboData = this._generateComboData();

      this.columnSelector.updateData(comboData);
      this.innerColumnSelector.updateData(comboData);

      if (comboData.length == 0) this.model.set("addMode", "hidden");
      else this.model.set("addMode", "add");

      this._refreshScroll(function() {
        setTimeout(function() {
          self._scrollBy(200);
        }, 100);
      });

    },

    _removeFilter: function(model) {

      var self = this;
      var view = this._filterViews[model.cid];

      view.$el.hide();
      view.clean();

      delete self._filterViews[model.cid];

      if (_.size(self._filterViews) < 1) {
        this.$el.find(".chooser").show();
        this.$el.find(".add_filter").hide();
      }

      this.excludedColumNames = _.without(this.excludedColumNames, model.get("column"));

      this.innerColumnSelector.updateData(this._generateComboData());
      this.innerColumnSelector.deselect();

      this.columnSelector.updateData(this._generateComboData());
      this.columnSelector.deselect();

      this.model.set("addMode", "add");

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


        sql = this._cleanSQL(sql);

      }

      this.trigger('writeSQL', sql);

    },

    _cleanSQL: function(sql) {

      String.prototype.rtrim=function(){return this.replace(/\s+$/,'');};

      cleaned_sql = sql.replace(/\(true\)\s*AND/g, "").rtrim();
      cleaned_sql = cleaned_sql.replace(/\AND\s*\(true\)/g, "").rtrim();
      cleaned_sql = cleaned_sql.replace(/WHERE\s*\B/, "WHERE ");
      cleaned_sql = cleaned_sql.replace(/WHERE$/, "");
      cleaned_sql = cleaned_sql.replace(/WHERE\s*true$/, "");

      return cleaned_sql;

    },

    render: function() {

      var self = this;

      this.$el.html(this.getTemplate('table/menu_modules/filters/templates/filters'));
      this.$el.find('.chooser').append(this.columnSelector.render().el);
      this.$el.find('.combo').prepend(this.innerColumnSelector.render().el);

      if (this.filters.length == 0) {
        this.$el.find(".chooser").show();
      } else {
        this.$el.find(".add_filter").show();
      }

      this._addFilters();

      return this;
    }

});

