  /**
   * choropleth
   */
  cdb.admin.mod.ChoroplethWizard = cdb.admin.mod.SimpleWizard.extend({

    //TODO: put this in a template
    error_msg: {
      NO_CONTENT_MSG: _t('There are no numeric columns on your table to make a choropleth visualization.<br/>If you have numbers on your table, but you don\'t see them here is likely they are set as String.')
    },


    initialize: function() {
      this.options.form = cdb.admin.forms.get('choropleth')[this.options.table.geomColumnTypes()[0]];
      this.setFormProperties();
      cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);

      this.type = 'choropleth';

      this.options.table.bind('change:schema', function() {
        if(!this.options.table.containsColumn(this.cartoProperties.get('property'))) {
          var columns = this._getNumberColumns();
          if(columns.length) {
            this.cartoProperties.set({ 'property': columns[0] }, {silent:true});
          }
        }
        this.setFormProperties();
        this.render();
      }, this);
    },

    isValid: function() {
      return this._getNumberColumns().length > 0;
    },

    render: function() {
      if(this.isValid()) {
        cdb.admin.mod.SimpleWizard.prototype.render.call(this);
      } else {
        this.renderError(this.error_msg.NO_CONTENT_MSG);
      }
      return this;
    },

    setFormProperties: function() {
      // If the table doesn't have any kind of geometry,
      // we avoid rendering the choroplethas
      if(this.options && this.options.form && this.options.form.length > 0) {
        var b = this.options.form[0].form.property.extra = this._getNumberColumns();
        this.options.form[0].form.property.value = b[0];
      }

    }

  });
