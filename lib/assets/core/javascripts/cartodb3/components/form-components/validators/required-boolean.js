/**
 * Adds a new validator for Boolean fields, based on Form.validators.required
 */

module.exports = function (options) {
  var err = {
    type: 'required',
    message: _t('components.backbone-forms.required-boolean-error')
  };

  return function required (value) {
    if (value === undefined) return err;
  };
};
