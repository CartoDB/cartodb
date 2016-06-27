var WidgetsFormStyleSchema = require('./widgets-form-style-schema-model');

module.exports = WidgetsFormStyleSchema.extend({

  initialize: function () {
    WidgetsFormStyleSchema.prototype.initialize.apply(this, arguments);
    this.schema.description = {
      type: 'TextArea',
      title: _t('editor.widgets.widgets-form.style.description')
    };
  }

});
