/**
* BubbleWizard
*/
cdb.admin.mod.BubbleWizard = cdb.admin.mod.SimpleWizard.extend({

  //TODO: put this in a template
  error_msg: {
    NO_CONTENT_MSG: _t('There are no numeric columns on your table to make a bubble visualization.<br/>If you have numbers on your table, but you don\'t see them here is likely they are set as String.')
  },

  initialize: function() {
    this.options.form = cdb.admin.forms.bubble_form;
    this.setFormProperties();
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);

    this.type = 'bubble';

    this.options.table.bind('change:schema', function() {
      this.setFormProperties();
      if(!this.options.table.containsColumn(this.cartoProperties.get('property'))) {
        var columns = this._getNumberColumns();
        if(columns.length) {
          this.cartoProperties.set({ 'property': columns[0] }, { silent: true });
        }

      }
      this.render();
    }, this);
  },

  setFormProperties: function() {
    if(this.options && this.options.form && this.options.form.length > 0) {
      var b = this.options.form[0].form.property.extra = this._getNumberColumns();
      this.options.form[0].form.property.value = b[0];
      this.cartoStylesGeneration
    }
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
  }

});


