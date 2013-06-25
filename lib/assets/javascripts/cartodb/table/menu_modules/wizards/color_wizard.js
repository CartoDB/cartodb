  
  /**
   *  Color map wizard
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
            name: "\"" + values[i] + "\"",
            form: {
              'custom': { type: 'color', value: self.value_colors[i] }
            }
          };

          this.form.form_data.push(form);
        }
      }

      this.form.render();
    },

    _cleanValues: function() {
      _.each(this.form.form_data,function(d) {
        if (d.form.custom) {
          debugger;
          // d.destroy();
        }
      })
    },

    _setValues: function(values) {
      this.cartoProperties.set('colors', _.object(values, this.value_colors));
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
        self._setValues(values);
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
