var Backbone = require('backbone');
var _ = require('underscore');
var NestedForm = require('builder/components/form-components/nested-form-custom');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

Backbone.Form.editors.List.MeasurementModel = Backbone.Form.editors.NestedModel.extend({
  initialize: function (options) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    EditorHelpers.setOptions(this, options);

    if (!this.form) throw new Error('Missing required option "form"');
    if (!options.schema.model) throw new Error('Missing required "schema.model" option for NestedModel editor');
  },

  render: function () {
    var data = this.value || {};
    var NestedModel = this.schema.model;

    // Wrap the data in a model if it isn't already a model instance
    var modelInstance = (data.constructor === NestedModel) ? data : new NestedModel(data, this.options);

    this.nestedForm = new NestedForm({
      className: 'Editor-formInner--nested',
      model: modelInstance,
      idPrefix: this.cid + '_',
      fieldTemplate: 'nestedField',
      template: _.template('<form data-fields="*"></form>'),
      trackingClass: this.options.trackingClass
    });

    this._observeFormEvents();

    this.listenTo(this.nestedForm, 'change', this._onChangeForm, this);
    // Render form
    this.$el.html(this.nestedForm.render().el);

    if (this.hasFocus) {
      this.trigger('blur', this);
    }

    return this;
  },

  _onChangeForm: function () {
    // To translate values and validation to parent form
    this.nestedForm.commit();
  },

  remove: function () {
    this.nestedForm && this.nestedForm.remove();
    Backbone.Form.editors.NestedModel.prototype.remove.call(this);
  }
});
