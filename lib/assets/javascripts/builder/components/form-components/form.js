var Backbone = require('backbone');

Backbone.Form = Backbone.Form.extend({

  initialize: function (options) {
    this.options = options;
    Backbone.Form.Original.prototype.initialize.call(this, options);
  },

  createField: function (key, schema) {
    var options = {
      form: this,
      key: key,
      schema: schema,
      idPrefix: this.idPrefix,
      trackingClass: this.options.trackingClass
    };

    if (this.model) {
      options.model = this.model;
    } else if (this.data) {
      options.value = this.data[key];
    } else {
      options.value = undefined;
    }

    var field = new this.Field(options);

    this.listenTo(field.editor, 'all', this.handleEditorEvent);

    return field;
  }

});
