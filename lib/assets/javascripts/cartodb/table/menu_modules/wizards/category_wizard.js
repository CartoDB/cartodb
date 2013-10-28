  
  /**
   *  Category wizard, it extends from color map wizard
   *  
   *  - It creates a collection (cartoProperties.categories) from the beginning.
   *  - This collection has the custom values of each column, if they 
   *  were previously set.
   *  - When cartoProperties are set, collection is reset and view is re-rendered.
   *  - Collection view and subviews are at the end of this file.
   *  
   *  var category_wizard = new cdb.admin.mod.CategoryWizard({
   *    table: table,
   *    model: model
   *  });
   *
   */

  cdb.admin.mod.CategoryWizard = cdb.admin.mod.ColorMapWizard.extend({

    initialize: function() {
      var self = this;
      this.cartoProperties = new cdb.core.Model();
      this.cartoProperties.categories = new Backbone.Collection();
      this.type = 'category';
      this.table = this.options.table;
      
      this.options.form = cdb.admin.forms.get('category')[this.options.table.geomColumnTypes()[0]];
      this.geomForm = cdb.admin.forms.get('simple_form')[this.options.table.geomColumnTypes()[0] || 'point'];

      this.add_related_model(this.model);
      this.add_related_model(this.options.table);
      this.add_related_model(this.cartoProperties.categories);
      
      this._addViews();
      this._unbindChanges();
      this._bindChanges();

      this.setFormProperties();

      this.options.table.bind('change:schema', function() {
        if(!this.options.table.containsColumn(this.cartoProperties.get('property'))) {
          var columns = this._getColorColumns();
          if(columns.length) {
            this.cartoProperties.set({ 'property': columns[0] }, { silent: true });
          }
        }
        this.setFormProperties();
        this.render();
      }, this);
    },

    _addViews: function() {
      // Properties form view
      this.form = new cdb.forms.Form({
        form_data: this.options.form || this.geomForm,
        model: this.cartoProperties
      });
      this.addView(this.form);

      // Custom categories view
      this.custom_categories = new cdb.admin.mod.CategoryWizard.CategoriesView({
        collection: this.cartoProperties.categories
      })
      this.addView(this.custom_categories);

      // Error view
      this.error = new cdb.admin.mod.ColorMapWizard.Error();
      this.addView(this.error);

      // Loader view
      this.loader = new cdb.admin.mod.ColorMapWizard.Loader();
      this.addView(this.loader);
    },

    _unbindChanges: function() {
      this.cartoProperties.unbind(null, null, this);
      this.cartoProperties.categories.unbind(null, null, this);
    },

    _bindChanges: function() {
      var self = this;

      this.cartoProperties.categories.bind('valueChanged', this._setCategories, this);

      this.cartoProperties.bind('change:property', function(m,c) {
        if (self._searchFieldByName('Column')) {
          self._searchFieldByName('Column').form.property.value = c;
        }
        self._getValues();
      }, this);

      this.cartoProperties.bind('change', function(m,c) {
        if (c && c.changes && c.changes.property) return false;
        
        /*
          WATCH OUT - IMPORTANT !
          - We have to prevent apply the style when category-wizard is selected and valid.
          - First thing is stop the action.
          - Then we need to select a column (first valid).
          - And finally get the values from that column.
         */
        if ((!self.cartoProperties.get('categories') || !self.cartoProperties.get('property'))) {
          self.setFormProperties(); // Set the new column
          self._getValues(); // Get the column values
          return false;
        }

        var sql = self._generateSQL();
        self.model.set({
          type: self.type,
          properties: _.clone(self.cartoProperties.attributes),
          sql: sql
        }, { silent: true });
        self.model.change({ changes: {'properties': ''} });
      }, this);
    },

    /**
     *  Generate categories collection from new query values
     *  and apply the new css.
     */
    _generateCategories: function(values) {
      var categories = [];
      var self = this;
      var column = this.cartoProperties.get('property') || (this._searchFieldByName('Column') && this._searchFieldByName('Column').form.property.value);
      var column_type = this.table.getColumnType(column);

      // Generate the proper categories
      _.each(values, function(value,i) {
        categories.push(
          new cdb.core.Model({
            title: value,
            title_type: column_type,
            color: self._DEFAULTS.value_colors[i],
            value_type: 'color'
          })
        )
      });

      // Add default category if it is necessary
      if (values.length >= this._DEFAULTS.max_values) {
        categories.push(
          new cdb.core.Model({
            title: self._TEXTS.default_color,
            title_type: "string",
            color: self._DEFAULTS.default_color,
            value_type: 'color',
            default: true
          })
        )
      }

      this.cartoProperties.categories.reset(categories);
      this._setCategories();
    },

    /**
     *  Generate colors array to be applied to carto properties
     */
    _setCategories: function() {
      var categories = [];

      this.cartoProperties.categories.each(function(m) {
        categories.push(m.toJSON());
      });

      this.cartoProperties.set('categories', categories);
    },

    /**
     *  Generate categories array to be applied to carto properties
     */
    _setupCategories: function() {
      var collection = [];
      var property = this.cartoProperties.get('property');
      var categories = [];

      if (this.cartoProperties.get('colors')) {
        categories = this._convertColorsToCategories();
        // Unset colors array
        this.cartoProperties.unset('colors', { silent: true });
        // Set new categories
        this.cartoProperties.set({ categories: categories }, { silent: true });
      } else {
        categories = this.cartoProperties.get('categories');
      }

      if (property && this.options.table.containsColumn(property)) {
        _.each(categories, function(obj) {
          collection.push( new cdb.core.Model(obj) );
        });
      }

      // Reset collection
      this.cartoProperties.categories.reset(collection);
    },

    /**
     *  Generate categories array from a colors array
     */
    _convertColorsToCategories: function() {
      var collection = [];
      var colors = this.cartoProperties.get('colors');

      for (var i in colors) {
        var obj = {
          title: colors[i][0],
          title_type: colors[i][2],
          color: colors[i][1],
          value_type: 'color'
        };

        if (colors[i][3]) {
          obj.default = true;
        }

        collection.push(obj)
      }

      return collection;
    },

    /**
     *  Get values from column selected
     */
    _getValues: function() {
      this._showLoader();
      this.custom_categories.hide();
      this.error.hide();

      var column = this._searchFieldByName('Column') && this._searchFieldByName('Column').form.property.value || '';
      var self = this;
      var tmpl = _.template('SELECT <%= column %>, count(<%= column %>) FROM <%= table_name %> ' + 
        'GROUP BY <%= column %> ORDER BY count DESC LIMIT ' + this._DEFAULTS.max_values);

      this.options.table.originalData()._sqlQuery(tmpl({
          table_name: this.options.table.get('name'),
          column: column
        }),
        function(data) {
          self._hideLoader();
          var values = _(data.rows).pluck(column);
          self._generateCategories(values);
          self.custom_categories.show();
        },
        function(err) {
          self._hideLoader();
          self.error.show();
        }
      );
    },

    setCarpropertiesSilent: function(p) {
      this._unbindChanges();
      this.cartoProperties.set(p);
      
      // Refresh ui components
      this._setupCategories();

      // End refreshing UI
      this._bindChanges();
    }
  });


  /**
   *  Custom categories view within Cagetories Wizard
   *  - Manage thanks to a collection.
   *  - Each item needs a model with 'title', 'title_type', 'color' || 'file',
   *  'value_type' and 'default' if it is neccessary.
   *
   *  new cdb.admin.mod.CategoryWizard.CategoryView({
   *    collection: categories
   *  })  
   */

  cdb.admin.mod.CategoryWizard.CategoriesView = cdb.core.View.extend({

    tagName: 'ul',

    className: 'custom_categories',

    initialize: function() {
      this.collection.bind('add remove reset', this.render, this);
    },

    render: function() {
      var self = this;

      // clean old views
      this.clearSubViews();

      // render new items
      this.collection.each(function(category) {
        var item = new cdb.admin.mod.CategoryWizard.CategoriesViewItem({
          model: category
        });

        self.$el.append(item.render().el);
        self.addView(item);
      });

      return this;
    }
  });


  /**
   *  Custom category item view using the categories collection.
   *  - It needs a model with 'title', 'title_type', 'color' || 'file',
   *  'value_type' and 'default' if it is neccessary.
   *
   *  new cdb.admin.mod.CategoryWizard.CategoriesViewItem({
   *    model: category
   *  })  
   */

  cdb.admin.mod.CategoryWizard.CategoriesViewItem = cdb.core.View.extend({
    
    tagName: 'li',
    
    className: 'custom_category_item',

    initialize: function() {
      this.template = cdb.templates.getTemplate('table/menu_modules/wizards/views/category_wizard_custom_categories');
    },
    
    render: function() {
      this.clearSubViews();
      
      this.$el.append(this.template(this.model.toJSON()));
      
      var view = new cdb.forms.Color({ model: this.model, property: 'color', extra: { image_property: 'file' }});
      this.model.bind("change", this._setModel, this);
      this.$el.find('span.field').append(view.render().el);
      this.addView(view);
      
      return this;
    },

    _setModel: function(model, obj) {
      if (obj.changes && obj.changes.file) {
        var file = model.get('file');
        model.set({ value_type: 'file' }, { silent: true })
      } else {
        model.set({ value_type: 'color' }, { silent: true })
      }

      this._triggerChange();
    },

    _triggerChange: function() {
      this.model.trigger('valueChanged')
    }

  });