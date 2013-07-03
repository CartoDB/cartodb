  
  /**
   *  Color map wizard
   */

  /*
    
    TODO:
      - Loader for getting values
      - Implement new queries: analize and get values.
      - Check with Santana.
      - TESTS!!!!
  */

  cdb.admin.mod.ColorMapWizard = cdb.admin.mod.SimpleWizard.extend({

    _TEXTS: {
      default_color: _t('Rest'),
      select_column: _t('Select a column')
    },

    // Color brewer qualitative paired
    value_colors: [
      '#A6CEE3',
      '#1F78B4',
      '#B2DF8A',
      '#33A02C',
      '#FB9A99',
      '#E31A1C',
      '#FDBF6F',
      '#FF7F00',
      '#CAB2D6',
      '#6A3D9A'
    ],

    max_values: 10,
    default_color: '#DDDDDD',

    initialize: function() {
      var self = this;
      this.cartoProperties = new cdb.core.Model();
      this.cartoProperties.colors = new Backbone.Collection();
      this.type = 'color';
      this.geomForm = cdb.admin.forms.simple_form[this.options.table.geomColumnTypes()[0] || 'point'];
      this.options.form = cdb.admin.forms.color[this.options.table.geomColumnTypes()[0]];
      this.setFormProperties();

      this.add_related_model(this.model);
      this.add_related_model(this.options.table);

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

      // Get previous applied colors
      if (this.model.get('properties').colors) {
        this._setupColors();
      }

      this._unbindChanges();
      this._bindChanges();

      this.options.table.bind('change:schema', function() {
        this.setFormProperties();
        if(!this.options.table.containsColumn(this.cartoProperties.get('property'))) {
          var columns = this._getColorColumns();
          if (columns.length) {
            this.setCarpropertiesSilent({ 'property': columns[0] })
          }
        }
        this.render();
      }, this);
    },

    render: function() {

      var $wrapper = $("<div>").addClass("wrapper")
      , $content = $("<div>").addClass("content");

      $content.append(this.form.render().el);
      $content.append(this.custom_colors.render().el);
      $wrapper.append($content);

      this.$el.html($wrapper);
      this.showTextFields();

      this.custom_scroll = new cdb.admin.CustomScrolls({
        el:     $wrapper,
        parent: $wrapper.parent()
      });

      this.addView(this.custom_scroll);

      return this;
    },

    _unbindChanges: function() {
      this.cartoProperties.unbind(null, null, this);
      this.cartoProperties.colors.unbind(null, null, this);
    },

    _bindChanges: function() {
      var self = this;

      this.cartoProperties.colors.bind('change', this._setColors, this);

      this.cartoProperties.bind('change:property', function(m,c) {
        if (self._searchFieldByName('Column'))
          self._searchFieldByName('Column').form.property.value = c;
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

    _generateColors: function(values) {
      var colors = [];
      var self = this;

      // Generate the proper colors
      _.each(values, function(value,i) {
        colors.push(
          new cdb.core.Model({
            color: self.value_colors[i],
            value: value
          })
        )
      });

      // Add custom color if it is necessary
      if (values.length >= this.max_values) {
        colors.push(
          new cdb.core.Model({
            color: self.default_color,
            value: self._TEXTS.default_color,
            default_color: true
          })
        )
      }

      this.cartoProperties.colors.reset(colors);
      this._setColors();
    },

    _setColors: function() {
      var colors = [];
      var column = this._searchFieldByName('Column') && this._searchFieldByName('Column').form.property.value || '';
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

    _setupColors: function() {
      var collection = [];
      var colors = this.model.get('properties').colors;
      
      _.each(colors, function(pair) {
        var m = new cdb.core.Model({
          value: pair[0],
          color: pair[1]
        });
        if (pair.length > 2) m.set('default_color', true);
        collection.push(m)
      })

      // Reset collection
      this.cartoProperties.colors.reset(collection);
    },

    _getValues: function() {
      var column = this._searchFieldByName('Column') && this._searchFieldByName('Column').form.property.value || '';

      var self = this;
      var tmpl = _.template('SELECT <%= column %>, count(<%= column %>) FROM <%= table_name %> GROUP BY <%= column %> ORDER BY count DESC LIMIT ' + this.max_values);
      this.options.table.originalData()._sqlQuery(tmpl({
        table_name: this.options.table.get('name'),
        column: column
      }),
      function(data) {
        var values = _(data.rows).pluck(column);
        self._generateColors(values);
      },
      null);
    },

    setFormProperties: function() {
      if (this.options && this.options.form && this.options.form.length > 0) {
        this.options.form[0].form.property.extra = this._getColorColumns();
        this.options.form[0].form.property.placeholder = this._TEXTS.select_column;
      }
    }
  });




  /**
   *  Custom colors view (It could contain)
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
   *  Custom colors item view
   */

  cdb.admin.mod.ColorMapWizard.ColorsViewItem = cdb.core.View.extend({
    tagName: 'li',
    className: 'custom_color_item',
    render: function() {
      this.clearSubViews();
      this.$el.append("<span>" + String(this.model.get("value")) + "</span><span class='field'></span>");
      var view = new cdb.forms.Color({ model: this.model, property: 'color' });
      this.$el.find('span.field').append(view.render().el);
      this.addView(view);
      return this;
    }
  })
