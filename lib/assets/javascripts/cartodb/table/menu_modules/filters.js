
cdb.admin.mod.Filters = cdb.admin.Module.extend({

    buttonClass: 'filters_mod',
    className: 'filters_panel',
    type: 'tool',

    events: {

      'click .clear a'            : '_onClickClearFilters',
      'click .add_filter .add'    : '_onClickShowFilterSelector',
      'click .add_filter .remove' : '_onClickHideFilterSelector',
      'scroll'                    : '_onScroll'
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

    _onClickHideFilterSelector: function(e) {

      e.preventDefault();
      e.stopPropagation();

      this.model.set("addMode", "add");

    },

    _onClickClearFilters: function(e) {
      e.preventDefault();
      e.stopPropagation();

      this.options.dataLayer.clearSQLView();
      this._hideQueryAppliedMessage();
    },

    _onClickShowFilterSelector: function(e) {
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
      _.bindAll(this, "loadScroll", "_refreshScroll");
      var self = this;
      this._initialized = false;
      this._filterViews = {};
      this.columns = new cdb.core.Model();
      this.model = new Backbone.Model({
        defaults: {
          addMode: false
        }
      });

      // don't initialize until the schema is not ready
      this.options.table.bind('change:schema change:original_schema', this.initFilters, this);
      this.add_related_model(this.options.table);
      var comboData = [];

      // Add combo boxes
      this.innerColumnSelector = new cdb.forms.ColumnTypeCombo({
        width: '200px',
        placeholder: 'Select a column to filter by',
        extra: comboData,
        property: 'column',
        model: self.columns
      });

      this.innerColumnSelector.bind('change', this._sendEvent, this);
      this.add_related_model(this.innerColumnSelector);

      this.columnSelector = new cdb.forms.ColumnTypeCombo({
        width: '200px',
        placeholder: 'Select a column to filter by',
        extra: comboData,
        property: 'column',
        model: self.columns
      });

      this.columnSelector.bind('change', this._sendEvent, this);
      this.add_related_model(this.columnSelector);

      if(this.options.table.has('schema')) {
        this.initFilters();
      }

    },

    initFilters: function() {
      // this function is attached to two changes that most of the time
      // are produced at the same time. Although signals are unbind backbone
      // does not support it
      if(this._initialized) {
        return;
      }
      this._initialized = true;

      var self = this;

      this.options.table.unbind('change:schema', this.initFilters, this);
      this.options.table.unbind('change:original_schema', this.initFilters, this);

      this.filters = new cdb.admin.models.Filters(null, {
        table: this.options.table,
        dataLayer: this.options.dataLayer
      });

      this.excludedColumNames = [];

      this.options.repeatInterval = this.options.repeatInterval || 200;

      this.add_related_model(this.filters);
      this.add_related_model(this.columns);
      this.add_related_model(this.options.table);
      this.add_related_model(this.options.dataLayer);

      this.options.table.bind("change:schema", this._onSchemaUpdate, this);
      this._onSchemaUpdate();

      // when SQL is cleared, remove filters
      this.options.dataLayer.bind('change:query', function(layer, sql) {
        if (!sql) {
          self.removeFilters();
          self._hideQueryAppliedMessage();
        } else {
          if(this.options.dataLayer.get('sql_source') !== 'filters') {
            this._unbindChangeQuery();
            self.removeFilters();
            this._bindChangeQuery();
          }
          if (!self.filters.size()) self._showQueryAppliedMessage();
        }
      }, this);
      this.add_related_model(this.options.dataLayer);

      this.columns.bind('change:column', function() {
        var col = this.columns.get('column');
        this.filters.add({
          column: col
        });
      }, this );
      this.add_related_model(this.columns);

      if (this.options.repeatInterval > 0) {
        this._filtersChanged = _.debounce(this._filtersChanged, this.options.repeatInterval);
      }

      // Filter bindings
      this.filters.bind('reset',                   this._addFilters,     this);
      this.filters.bind('add',                     this._addFilter,      this);
      this.filters.bind('remove',                  this._removeFilter,   this);

      this.model.bind('change:addMode',            this._onToggleMode, this);
      this._bindChangeQuery();

      var f = this.options.dataLayer.get('filters');

      if (f) {
        this.filters.reset(f);
      }

    },

    _addOrToggleSwitch: function () {
      this.orSwitch = new cdb.forms.Switch({
        el: this.$el.find(".switch"),
        model: this.options.dataLayer,
        property: "sql_or_toggle"
      });
    },

    changeSQLEvents: [
       'add',
       'remove',
       'change:items',
       'add:operations',
       'remove:operations',
       'change:operations',
       'change:lower',
       'change:upper',
       'change:list_view'
    ].join(' '),

    _bindChangeQuery: function() {
      this.filters.bind(this.changeSQLEvents, this._filtersChanged, this);
      this.options.dataLayer.bind('change:sql_or_toggle', this._filtersChanged, this);
    },

    _unbindChangeQuery: function() {
      this.filters.unbind(this.changeSQLEvents, this._filtersChanged, this);
      this.options.dataLayer.unbind('change:sql_or_toggle', this._filtersChanged, this);
    },

    _onSchemaUpdate: function() {

      // Update the combos with the columns available in the table
      var comboData = this._generateComboData();

      this.columnSelector.updateData(comboData);
      this.innerColumnSelector.updateData(comboData);

    },

    _generateComboData: function() {

      var self = this;

      var schema = this.options.table.get("original_schema") || this.options.table.get("schema");

      var allowedTypes = ["string", "number", "boolean", "date"];

      return _.filter(schema, function(field) {

        var
        name       = field[0],
        fieldType  = field[1];

        return _.contains(allowedTypes, fieldType) && !_.contains(self.excludedColumNames, name) && name != "cartodb_id";

      }).map(function(field) {

        var name = field[0];

        return [field[1], field[0]];
      });

    },

    loadScroll: function() {

      //if (this.api || this.model.get("hasScroll")) return;

      var self = this;

      this.model.set("hasScroll", true);

      setTimeout(function() {

        var $scrollPane = self.$el.find(".scrollpane");

        $scrollPane.css("height", self.$el.outerHeight(true));
        $scrollPane.css("max-height", self.$el.outerHeight(true) - 60);

        $scrollPane.jScrollPane({ showArrows: true, animateScroll: true, animateDuration: 150 });
        self.api = $scrollPane.data('jsp');

      }, 250);

    },

    _scrollTo: function(y) {
      if (this.api) this.api.scrollToY(y);
    },

    _scrollBy: function(y) {
      if (this.api) this.api.scrollByY(y);
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
      if (columnType == 'number' || columnType == 'date') {
        return cdb.admin.mod.Filter;
      } else {
        return cdb.admin.mod.SelectorFilter;
      }
    },

    _addFilters: function() {
      var self = this;

      if (this.filters) {
        this.filters.each(function(f) {
          self._addFilter(f);
        });
      }

    },

    _addFilter: function(column) {

      var self = this;

      if (!column.has('column_type')) {
        cdb.log.error("model should contain column_type, filter is not added");
        return;
      }

      this.$el.find(".chooser").hide();
      this.$el.find(".add_filter").show();

      var columnType = column.get('column_type');

      var ViewClass = this._getFilterViewforColumnType(columnType);

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

      // Hide the filter's combo
      this.model.set("addMode", "add");

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

      this._scrollTo(0);
      this._refreshScroll();

    },

    _filtersChanged: function() {

      // Serialize to layer
      this.options.dataLayer.set({
        'filters': this.filters.toJSON()
      }, { silent: true });

      var sql;

      if (this.filters.size()) {

        sql = _.template("SELECT * FROM <%= table %> WHERE <%= cond %>")({
          table: this.options.table.get('id'),
          cond: this.filters.getSQLCondition()
        });

        sql = this._cleanSQL(sql);
        this.options.dataLayer.applySQLView(sql, {
          sql_source: 'filters'
        });

      } else {
        this.options.dataLayer.clearSQLView();
      }

    },

    _cleanSQL: function(sql) {

      String.prototype.rtrim=function(){return this.replace(/\s+$/,'');};

      cleaned_sql = sql.replace(/\(true\)\s*AND/g, "").rtrim();
      cleaned_sql = cleaned_sql.replace(/\AND\s*\(true\)/g, "").rtrim();
      cleaned_sql = cleaned_sql.replace(/WHERE\s*\B/, "WHERE ");
      cleaned_sql = cleaned_sql.replace(/WHERE$/, "");
      cleaned_sql = cleaned_sql.replace(/WHERE\s*true$/, "");
      cleaned_sql = cleaned_sql.replace(/\sWHERE\s*\(true\)$/, "");

      return cleaned_sql;

    },

    _hideQueryAppliedMessage: function() {
      this.$el.find(".applied_query").hide();
      this.$el.find(".form_combo").show();
      this.$el.find(".help").show();
    },

    _showQueryAppliedMessage: function() {
      this.$el.find(".form_combo").hide();
      this.$el.find(".help").hide();
      this.$el.find(".applied_query").show();
    },

    _sendEvent: function(column) {
      // Event tracking "Applied filter"
      cdb.god.trigger('metrics', 'filter', {
        email: window.user_data.email
      });
    },

    render: function() {

      var self = this;

      var template = this.getTemplate('table/menu_modules/filters/templates/filters');

      var sqlSource = this.options.dataLayer.get("sql_source");
      var query     = this.options.dataLayer.get("query");

      var isQueryApplied = (query && sqlSource != 'filters');

      this.$el.html(template({
        isQueryApplied: isQueryApplied,
        sql_or_toggle: this.options.dataLayer.get('sql_or_toggle')
      }));

      this.$el.find('.chooser').append(this.columnSelector.render().el);
      this.$el.find('.combo').prepend(this.innerColumnSelector.render().el);

      if (this.filters == undefined || this.filters.length == 0) {
        this.$el.find(".chooser").show();
      } else {
        this.$el.find(".add_filter").show();
      }

      if (isQueryApplied) {
        this._showQueryAppliedMessage();
      }

      this._addOrToggleSwitch();

      return this;
    }

});

