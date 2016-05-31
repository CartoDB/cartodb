var Backbone = require('backbone');
var cdb = require('cartodb.js');
require('../../../../components/form-components/index');

var CHECK_FORM_VALIDATION_TOO = {validate: true};

/**
 * This view is required because a schema change require the Backbone.Form object to be re-created to update the view as expected.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.formModel) throw new Error('formModel is required');

    this._formModel = opts.formModel;

    this._formModel.on('changeSchema', this.render, this);
    this.add_related_model(this._formModel);
  },

  render: function () {
    this.clearSubViews();

    this._analysisFormView = new Backbone.Form({
      model: this._formModel,
      template: this._formModel.getTemplate(),
      templateData: this._formModel.getTemplateData()
    });

    this._analysisFormView.bind('change', function () {
      this.model.setFormValidationErrors(undefined);
      this.model.set(this.getValue());
      var formValidationErrors = this.commit(CHECK_FORM_VALIDATION_TOO);
      this.model.setFormValidationErrors(formValidationErrors);
    });

    this.$el.append(this._analysisFormView.render().el);

    return this;
  },

  /**
   * @override cdb.core.View.prototype.clearSubViews
   */
  clearSubViews: function () {
    if (this._analysisFormView) {
      this._analysisFormView.remove(); // the Backbone.Form equivalent to "view.clean()"
    }

    return cdb.core.View.prototype.clearSubViews.apply(this, arguments);
  }

});
