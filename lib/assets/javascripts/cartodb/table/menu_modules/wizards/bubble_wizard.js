/**
* BubbleWizard
*/
cdb.admin.mod.BubbleWizard = cdb.admin.mod.SimpleWizard.extend({

  //TODO: put this in a template
  error_msg: {
    NO_CONTENT_MSG: _t('There are no numeric columns on your dataset to make a bubble map.<br/>If you have numbers on your dataset, but you don\'t see them here is likely they are set as String.')
  },

  initialize: function() {
    this.type = 'bubble';
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);
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


