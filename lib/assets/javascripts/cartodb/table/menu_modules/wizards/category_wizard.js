
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
  cdb.admin.mod.CategoryWizard = cdb.admin.mod.SimpleWizard.extend({

    _TEXTS: {
      default_color:    _t('Others'),
      select_column:    _t('Select a column'),
      no_valid_columns: _t('There are no valid columns on your table to make a this visualization. \
                            Try to add a new one or change the existing ones to a valid type \
                            (string, number or boolean).')
    },

    initialize: function() {
      var self = this;
      this.type = this.type || 'category';
      cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);
      this.table = this.options.table;
      this.categories = new Backbone.Collection(this.cartoProperties.get('categories'));

      this.cartoProperties.bind('change:metadata', this._getMetadata, this);
      this.categories.bind('change reset', function() {
        this.cartoProperties.set('categories', this.categories.toJSON());
      }, this);

      this.cartoProperties.bind('load', this._hideLoader, this);
      this.cartoProperties.bind('loading', this._showLoader, this);

      this.add_related_model(this.categories);

      this._addViews();
    },

    _showLoader: function() {
      this.loader.show();
    },

    _hideLoader: function() {
      this.loader.hide();
    },

    render: function() {
      var $wrapper = $("<div>").addClass("wrapper")
      , $content = $("<div>").addClass("content");

      if (this.isValid()) {
        $content.append(this.form.render().el);
        $content.append(this.custom_categories.render().el);
        $content.append(this.error.render().el);
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
      return this._getColorColumns().length > 0;
    },

    _addViews: function() {
      // Properties form view
      this.form = new cdb.forms.Form({
        form_data: this.cartoProperties.formData(this.type),
        model: this.cartoProperties
      });
      this.addView(this.form);

      // Custom categories view
      this.custom_categories = new cdb.admin.mod.CategoryWizard.CategoriesView({
        collection:       this.categories,
        cartoProperties:  this.cartoProperties
      });
      this.addView(this.custom_categories);

      // Error view
      this.error = new cdb.admin.mod.CategoryWizard.Error();
      this.addView(this.error);

      // Loader view
      this.loader = new cdb.admin.mod.CategoryWizard.Loader();
      this.addView(this.loader);
    },

    _getMetadata: function() {
      // Set new categories
      var metadata = this.cartoProperties.get('metadata');
      
      // check if the metadata is an object array

      if (metadata && metadata.length && metadata[0].title !== undefined) {
        this.categories.reset(metadata);
      }
    },

    comeFromColor: function() {
      var colors = _.clone(this.model.get('properties').colors);
      var categories = _.clone(this.model.get('properties').categories);

      for (var i = 0, l = colors.length; i < l; i++) {
        if ((colors[i][0] != categories[i].title) || (colors[i][1] != categories[i].color) || (colors[i][2] != categories[i].title_type)) {
          return false;
        }
      }

      return true;
    }

  });


  /**
   *  Custom categories view within Categories Wizard
   *  - Manage thanks to a collection.
   *  - Each item needs a model with 'title', 'title_type', 'color' || 'file',
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
      this.add_related_model(this.collection);
    },

    render: function() {
      var self = this;

      // clean old views
      this.clearSubViews();

      // render new items
      this.collection.each(function(category) {
        var item = new cdb.admin.mod.CategoryWizard.CategoriesViewItem({
          model:            category,
          cartoProperties:  self.options.cartoProperties
        });

        self.$el.append(item.render().el);
        self.addView(item);
      });

      return this;
    }
  });


  /**
   *  Custom category item view using the categories collection.
   *  - It needs a model with 'title', 'title_type', 'color' || 'file',
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

      var view = new cdb.admin.mod.CategoryColor({
        model:            this.model,
        property:         'color',
        extra:            { image_property: 'file' },
        cartoProperties:  this.options.cartoProperties
      });

      this.model.bind("change", this._setModel, this);
      this.$('span.field').append(view.render().el);
      this.addView(view);

      return this;
    },

    _setModel: function(model, obj) {
      if (obj.changes && obj.changes.file && model.get('file')) {
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

  
  
  /**
   *  Custom color form to check extra colors each time
   *  is opened.
   *
   */

  cdb.admin.mod.CategoryColor = cdb.forms.Color.extend({
    
    _createPicker: function() {
      // Get wizard applied colors
      if (this.options.cartoProperties) {
        this.options.extra_colors = this._getExtraColors()
      }
      
      cdb.forms.Color.prototype._createPicker.call(this);
    },

    _getExtraColors: function() {
      if (!this.options.cartoProperties) return [];
      
      // Tile style
      var style = this.options.cartoProperties.layer.get("tile_style");
      var cartoParser = new cdb.admin.CartoParser(style);
      return cartoParser.colorsUsed( { mode: "hex" });
    }

  })


  /**
   *  Error message
   */

  cdb.admin.mod.CategoryWizard.Error = cdb.core.View.extend({

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

  cdb.admin.mod.CategoryWizard.Loader = cdb.core.View.extend({

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
