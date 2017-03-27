var Backbone = require('backbone');
var _ = require('underscore');
var NestedForm = require('../../nested-form-custom');

Backbone.Form.editors.List.MeasurementModel = Backbone.Form.editors.NestedModel.extend({

  initialize: function (options) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    Backbone.Form.editors.Base.prototype._setOptions.call(this, options); // Options

    if (!this.form) throw new Error('Missing required option "form"');
    if (!options.schema.model) throw new Error('Missing required "schema.model" option for NestedModel editor');
  },

  render: function () {
    var data = this.value || {};
    var NestedModel = this.schema.model;

    // Wrap the data in a model if it isn't already a model instance
    var modelInstance = (data.constructor === NestedModel) ? data : new NestedModel(data, this.options);

    this.nestedForm = new NestedForm({
      model: modelInstance,
      idPrefix: this.cid + '_',
      fieldTemplate: 'nestedField',
      template: _.template('<form data-fields="*"></form>')
    });

    this._observeFormEvents();

    // Render form
    this.$el.html(this.nestedForm.render().el);

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  }

});
