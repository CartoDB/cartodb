  
  /**
   *  Color map wizard
   */

  /*
    
    TODO:
      - Difference between string, number or boolean comparision
      - Loader for getting values
      - Implement new queries: analize and get values.
      - Set limit of the values and the default one in that case.
      - Check from the beginning if color map was previously defined.
      - Check with Santana :).
  */

  cdb.admin.mod.ColorMapWizard = cdb.admin.mod.SimpleWizard.extend({

    value_colors: [
      '#FFC926' /*yellow*/,
      '#FF5C26' /*orange*/,
      '#0099EF' /*blue*/,
      '#59B303' /*green*/,
      '#A53ED5' /*purple*/,
      '#D6301D' /*red*/,
      '#FF00FF' /*pink*/,
      '#008C8C' /*special green*/
    ],

    max_values: 8,
    default_color: '#5CA2D1',


    initialize: function() {
      this.options.form = cdb.admin.forms.color[this.options.table.geomColumnTypes()[0]];

      this.setFormProperties();
      cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);

      this.type = 'color';

      this.colors = [];

      this.options.table.bind('change:schema', function() {
        this.setFormProperties();
        if(!this.options.table.containsColumn(this.cartoProperties.get('property'))) {
          var columns = this._getColumns();
          if (columns.length) {
            this.setCarpropertiesSilent({ 'property': columns[0] })
          }
        }
        this.render();
      }, this);
    },

    _bindChanges: function() {
      var self = this;
      var flag = true;

      this.cartoProperties.bind('change:property', function(m,c) {
        if (self._searchFieldByName('Column'))
          self._searchFieldByName('Column').form.property.value = c;
        self._getValues();
      }, this);
      this.cartoProperties.bind('change', function(m,c) {
        if (c && c.changes.property) return false;

        var sql = self._generateSQL()
        self.model.set({
          type: self.type,
          properties: _.clone(self.cartoProperties.attributes),
          sql: sql
        }, { silent: true });
        self.model.change({ changes: {'properties': ''} });
      }, this);
    },

    _renderValues: function(values) {
      var self = this;

      // Clean old values
      this._cleanValues();

      // Create new colors
      if (values.length) {
        for (var i = 0, l = values.length; i < l; i++) {

          var form = {
            custom: true,
            name: "\"" + values[i] + "\"",
            form: {}
          };

          var color = self.cartoProperties.get(values[i]) || self.value_colors[i];

          // Add new form
          form.form[ values[i] ] = { type: 'color', value: color };
          this.form.form_data.push(form);

          // Set new cartocss property
          this.cartoProperties.set(values[i], color, { silent: true });
        }
      }

      this.cartoProperties.set('colors', values);
      this.form.render();
    },

    _cleanValues: function() {
      var self = this;

      // Remove color components
      _.each(this.form.form_data,function(d,i) {
        if (d.custom) {
          delete self.form.form_data[i];
        }
      });
      this.form.form_data = _.compact(this.form.form_data);

      // Remove each value from cartoProperties
      var colors = this.cartoProperties.get('colors');
      _.each(colors, function(color) {
        self.cartoProperties.unset(color, { silent: true });
      })
      
      // Remove colors array from cartoProperties
      this.setCarpropertiesSilent({ 'colors': [] });
    },

    _getValues: function() {
      var column = this._searchFieldByName('Column') && this._searchFieldByName('Column').form.property.value || '';

      var self = this;
      var tmpl = _.template('select <%= column %> from <%= table_name %> LIMIT 13');
      this.options.table.originalData()._sqlQuery(tmpl({
        table_name: this.options.table.get('name'),
        column: column
      }),
      function(data) {
        var values = _(data.rows).pluck(column);
        self._renderValues(values);
      },
      null);
    },

    setFormProperties: function() {
      if (this.options && this.options.form && this.options.form.length > 0) {
        var b = this.options.form[0].form.property.extra = this._getColumns();
        this.options.form[0].form.property.value = b[0];
      }
    }
  });
