var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

Backbone.Form.editors.List.CategoryModel = Backbone.Form.editors.NestedModel.extend({

  initialize: function (options) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    EditorHelpers.setOptions(this, options);

    if (!this.form) throw new Error('Missing required option "form"');
    if (!options.schema.model) throw new Error('Missing required "schema.model" option for NestedModel editor');
  },

  render: function () {
    // Get the constructor for creating the nested form; i.e. the same constructor as used by the parent form
    var NestedForm = this.form.constructor;

    var data = this.value || {};
    var NestedModel = this.schema.model;

    // Wrap the data in a model if it isn't already a model instance
    var modelInstance = (data.constructor === NestedModel) ? data : new NestedModel(data, this.options);

    this.nestedForm = new NestedForm({
      model: modelInstance,
      idPrefix: this.cid + '_',
      fieldTemplate: 'nestedField'
    });

    this._observeFormEvents();

    // Render form
    this.$el.html(this.nestedForm.render().el);

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  }

});
