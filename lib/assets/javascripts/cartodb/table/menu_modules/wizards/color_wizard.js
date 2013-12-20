
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
   */


  cdb.admin.mod.ColorMapWizard = cdb.admin.mod.SimpleWizard.extend({

    _TEXTS: {
      default_color:    _t('Others'),
      select_column:    _t('Select a column'),
      no_valid_columns: _t('There are no valid columns on your table to make a this visualization. \
                            Try to add a new one or change the existing ones to a valid type \
                            (string, number or boolean).')
    },


    initialize: function() {
      var self = this;
      this.type = 'color';
      cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);

      /*
       */
      this.cartoProperties.colors = new Backbone.Collection();
      this.add_related_model(this.cartoProperties.colors);

      this._addViews();
      this.wizard_properties.bind('change:metadata', this._getMetadata, this);
      /*
      this.cartoProperties.colors.bind('change', this._setColors, this);

      this.cartoProperties.bind('change', function(mod, options) {
        // If property column changes, add the loader and
        // reset the colors list
        if (options && options.changes && options.changes.property) {
          this.cartoProperties.colors.reset([]);
          this._showLoader();
        }

        this.applyWizard();
      }, this);
      */
    },

    render: function() {
      var $wrapper = $("<div>").addClass("wrapper")
      , $content = $("<div>").addClass("content");

      if (this.isValid()) {
        $content.append(this.form.render().el);
        $content.append(this.custom_colors.render().el);
        $content.append(this.colors_error.render().el);
        $content.append(this.loader.render().el);

        $wrapper.append($content);

        // Remove old custom scroll
        if (this.custom_scroll) {
          this.removeView(this.custom_scroll);
          this.custom_scroll.clean();
        }

        // Add new custom scroll
        this.custom_scroll = new cdb.admin.CustomScrolls({
          el:     $wrapper,
          parent: $wrapper.parent()
        });

        this.addView(this.custom_scroll);
        this.$el.html($wrapper);
      } else {
        this.renderError(this._TEXTS.no_valid_columns);
      }

      return this;
    },

    isValid: function() {
      return this._getColorColumns().length > 0
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


    _bindChanges: function() {
      var self = this;

    },

    _getMetadata: function() {
      // Hide loader
      this._hideLoader();
      // Set new colors
      this.cartoProperties.set({ 'colors': this.model.get('metadata') });
    },

    /**
     *  Generate colors array to be applied to carto properties
     */
    _setColors: function() {
      var colors = [];

      var column = this.cartoProperties.get('property') || 
        (this._searchFieldByName('Column') && this._searchFieldByName('Column').form.property.value);
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
      var property = this.cartoProperties.get('property');

      if (this.cartoProperties.get('property') && this.options.table.containsColumn(property)) {
        _.each(colors, function(pair) {
          var m = new cdb.core.Model({
            value: pair[0],
            color: pair[1]
          });
          if (pair.length > 3) m.set('default_color', true);
          collection.push(m);
        });
      }

      // Reset collection
      this.cartoProperties.colors.reset(collection);
    },

    _showLoader: function() {
      this.loader.show();
    },

    _hideLoader: function() {
      this.loader.hide();
    },

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
      this.$el.html(this.template());
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
      this.$el.html(this.template());
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

      var view = new cdb.forms.Color({
        model: this.model,
        property: 'color',
        extra: {
          image_property: "color"
        }
      });
      this.$el.find('span.field').append(view.render().el);
      this.addView(view);

      return this;
    }
  });
