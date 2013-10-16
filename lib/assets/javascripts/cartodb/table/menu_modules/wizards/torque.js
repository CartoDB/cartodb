cdb.admin.mod.TorqueWizard = cdb.admin.mod.SimpleWizard.extend({

  MODULES: [],
  LAYER_PROPS: ['property', 
    'torque-duration',
    'torque-steps',
    'torque-blend-mode',
    'torque-trails',
    'torque-is-time'
  ],

  error_msg: {
    NO_CONTENT_MSG: _t('There are no numeric or date columns on your table to make an animated visualization.<br/>If you have numbers on your table, but you don\'t see them here is likely they are set as String.')
  },

  initialize: function() {
    this.options.form = cdb.admin.forms.get('torque');
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);

    this.type = 'torque';
    this.layer_type = 'torque';

    this.options.table.bind('change:schema', function() {
      if(!this.options.table.containsColumn(this.cartoProperties.get('property'))) {
        var columns = this.validColumns();
        if(columns.length) {
          this.cartoProperties.set({ 
            'property': columns[0] 
          }, {
            silent:true
          });
        }
      }
      this.setFormProperties();
      this.render();
    }, this);

  },

  validColumns: function() {
    return this.options.table.columnNamesByType('number').concat(
      this.options.table.columnNamesByType('date')
    );
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
      //TODO: user numeric columns too
      var b = this.options.form[0].form.property.extra = this.validColumns();
      this.options.form[0].form.property.value = b[0];
    }
    this.setTextProperties();
  }

});


