  
  /**
   *  Color map wizard
   *  
   *  - It creates a collection (cartoProperties.colors) from the beginning.
   *  - This collection has the custom colors of each column, if they 
   *  were previously set.
   *  - When cartoProperties are set, collection is reset and view is re-rendered.
   *  - Collection view and subviews are at the end of this file.
   *  
   *  var color_wizard = new cdb.admin.mod.ColorMapWizard({
   *    table: table,
   *    model: model
   *  });
   *
   *  TODO:
   *  - Bind when new values have been added to the table.
   */


  cdb.admin.mod.ColorMapWizard = cdb.admin.mod.SimpleWizard.extend({

    _TEXTS: {
      default_color: _t('Others'),
      select_column: _t('Select a column')
    },

    _DEFAULTS: {
      // Color brewer qualitative paired
      value_colors: ['#A6CEE3','#1F78B4','#B2DF8A','#33A02C','#FB9A99','#E31A1C','#FDBF6F','#FF7F00','#CAB2D6','#6A3D9A'],
      default_color: '#DDDDDD',
      max_values: 10
    },

    initialize: function() {
      var self = this;
      this.cartoProperties = new cdb.core.Model();
      this.cartoProperties.colors = new Backbone.Collection();
      this.type = 'color';
      
      this.options.form = cdb.admin.forms.color[this.options.table.geomColumnTypes()[0]];
      this.geomForm = cdb.admin.forms.simple_form[this.options.table.geomColumnTypes()[0] || 'point'];

      this.setFormProperties();

      this.add_related_model(this.model);
      this.add_related_model(this.options.table);
      this.add_related_model(this.cartoProperties.colors);
      
      this._addViews();
      this._unbindChanges();
      this._bindChanges();

      this.options.table.bind('change:schema change:original_schema', function() {
        this.setFormProperties();
        
        // If the column doesn't exist anymore, we have to
        // reset the wizard
        if (this.cartoProperties.get('property') &&
          !this.options.table._getColumn(this.cartoProperties.get('property'))) {
          this._resetWizard();
        }

        this.render();
      }, this);
    },

    render: function() {

      var $wrapper = $("<div>").addClass("wrapper")
      , $content = $("<div>").addClass("content");

      $content.append(this.form.render().el);
      $content.append(this.custom_colors.render().el);
      $content.append(this.colors_error.render().el);
      $content.append(this.loader.render().el);
      $wrapper.append($content);

      this.$el.html($wrapper);

      // Remove old custom scroll
      if (this.custom_scroll) {
        this.removeView(this.custom_scroll);
        this.custom_scroll.clean();
      }
      
      // Create new scroll
      this.custom_scroll = new cdb.admin.CustomScrolls({
        el:     $wrapper,
        parent: $wrapper.parent()
      });

      this.addView(this.custom_scroll);

      return this;
    },

    _resetWizard: function() {
      this.cartoProperties.colors.reset();
      this.cartoProperties.set({ 'colors': [] });
    },

    _addViews: function() {
      // Properties form view
      this.form = new cdb.forms.Form({
        form_data: this.options.form || this.geomForm,
        model: this.cartoProperties
      });
      this.addView(this.form);

      // Custom colors view
      this.custom_colors = new cdb.admin.mod.ColorMapWizard.ColorsView({
        collection: this.cartoProperties.colors
      })
      this.addView(this.custom_colors);

      // Error view
      this.colors_error = new cdb.admin.mod.ColorMapWizard.Error();
      this.addView(this.colors_error);

      // Loader view
      this.loader = new cdb.admin.mod.ColorMapWizard.Loader();
      this.addView(this.loader);
    },

    _unbindChanges: function() {
      this.cartoProperties.unbind(null, null, this);
      this.cartoProperties.colors.unbind(null, null, this);
    },

    _bindChanges: function() {
      var self = this;

      this.cartoProperties.colors.bind('change', this._setColors, this);

      this.cartoProperties.bind('change:property', function(m,c) {
        if (self._searchFieldByName('Column')) {
          self._searchFieldByName('Column').form.property.value = c;
        }
        self._getValues();
      }, this);

      this.cartoProperties.bind('change', function(m,c) {
        if (c && c.changes && c.changes.property) return false;

        var sql = self._generateSQL()
        self.model.set({
          type: self.type,
          properties: _.clone(self.cartoProperties.attributes),
          sql: sql
        }, { silent: true });
        self.model.change({ changes: {'properties': ''} });
      }, this);
    },

    /**
     *  Generate colors collection from new query values
     *  and apply the new css.
     */
    _generateColors: function(values) {
      var colors = [];
      var self = this;

      // Generate the proper colors
      _.each(values, function(value,i) {
        colors.push(
          new cdb.core.Model({
            color: self._DEFAULTS.value_colors[i],
            value: value
          })
        )
      });

      // Add custom color if it is necessary
      if (values.length >= this._DEFAULTS.max_values) {
        colors.push(
          new cdb.core.Model({
            color: self._DEFAULTS.default_color,
            value: self._TEXTS.default_color,
            default_color: true
          })
        )
      }

      this.cartoProperties.colors.reset(colors);
      this._setColors();
    },

    /**
     *  Generate colors array to be applied to carto properties
     */
    _setColors: function() {
      var colors = [];
      var column = this.cartoProperties.get('property') || (this._searchFieldByName('Column') && this._searchFieldByName('Column').form.property.value);
      var column_type = this.options.table.getColumnType(column) || 'string';
      this.cartoProperties.colors.each(function(m) {
        var inner_array = [];
        inner_array.push(m.get('value'));
        inner_array.push(m.get('color'));
        inner_array.push(column_type);
        if (m.get('default_color')) inner_array.push(true);
        colors.push(inner_array);
      });

      this.cartoProperties.set('colors', colors);
    },

    /**
     *  Generate colors array to be applied to carto properties
     */
    _setupColors: function() {
      var collection = [];
      var colors = this.cartoProperties.get('colors');
      
      _.each(colors, function(pair) {
        var m = new cdb.core.Model({
          value: pair[0],
          color: pair[1]
        });
        if (pair.length > 3) m.set('default_color', true);
        collection.push(m);
      })

      // Reset collection
      this.cartoProperties.colors.reset(collection);
    },

    /**
     *  Get values from column selected
     */
    _getValues: function() {
      this._showLoader();
      this.custom_colors.hide();
      this.colors_error.hide();

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
          self._generateColors(values);
          self.custom_colors.show();
        },
        function(err) {
          self.colors_error.show();
        }
      );
    },

    _showLoader: function() {
      this.loader.show();
    },

    _hideLoader: function() {
      this.loader.hide();
    },

    setCarpropertiesSilent: function(p) {
      this._unbindChanges();
      this.cartoProperties.set(p);
      // Refresh ui components
      this._setupColors();
      // End refreshing ui
      this._bindChanges();
    },

    setFormProperties: function() {
      if (this.options && this.options.form && this.options.form.length > 0) {
        this.options.form[0].form.property.extra = this._getColorColumns();
        this.options.form[0].form.property.placeholder = this._TEXTS.select_column;
        this.options.form[0].form.property.value = '';
      }
    }
  });


  /**
   *  Error message
   */

  cdb.admin.mod.ColorMapWizard.Error = cdb.core.View.extend({

    tagName: 'div',

    className: 'colors_error',

    initialize: function() {
      this.template = cdb.templates.getTemplate('table/menu_modules/wizards/views/color_wizard_error');
    },

    render: function() {
      this.$el.append(this.template());
      return this;
    }
  });


  /**
   *  Simple loader to request column values 
   */

  cdb.admin.mod.ColorMapWizard.Loader = cdb.core.View.extend({

    tagName: 'div',

    className: 'colors_loader',

    initialize: function() {
      this.template = cdb.templates.getTemplate('table/menu_modules/wizards/views/color_wizard_loader');
    },

    render: function() {
      this.$el.append(this.template());
      return this;
    }
  });


  /**
   *  Custom colors view within Color Wizard
   *  - Manage thanks to a collection.
   *  - Each item needs a model with 'color', 'value' and 'default_color'
   *  if it is neccessary.
   *
   *  new cdb.admin.mod.ColorMapWizard.ColorsView({
   *    collection: colors
   *  })  
   */

  cdb.admin.mod.ColorMapWizard.ColorsView = cdb.core.View.extend({

    tagName: 'ul',

    className: 'custom_colors',

    initialize: function() {
      this.collection.bind('add remove reset', this.render, this);
    },

    render: function() {
      var self = this;

      // clean old views
      this.clearSubViews();

      // render new items
      this.collection.each(function(color) {
        var item = new cdb.admin.mod.ColorMapWizard.ColorsViewItem({
          model: color
        });

        self.$el.append(item.render().el);
        self.addView(item);
      });

      return this;
    }
  });


  /**
   *  Custom colors item view using the colors collection.
   *  - It needs a model with color, value and if it is neccessary default_color attributes.
   *
   *  new cdb.admin.mod.ColorMapWizard.ColorsViewItem({
   *    model: color
   *  })  
   */

  cdb.admin.mod.ColorMapWizard.ColorsViewItem = cdb.core.View.extend({
    
    tagName: 'li',
    
    className: 'custom_color_item',

    initialize: function() {
      this.template = cdb.templates.getTemplate('table/menu_modules/wizards/views/color_wizard_custom_colors');
    },
    
    render: function() {
      this.clearSubViews();
      
      this.$el.append(this.template(this.model.toJSON()));
      
      var view = new cdb.forms.Color({ model: this.model, property: 'color' });
      this.$el.find('span.field').append(view.render().el);
      this.addView(view);
      
      return this;
    }
  });
