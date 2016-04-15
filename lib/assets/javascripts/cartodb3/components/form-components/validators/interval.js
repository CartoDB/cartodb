var Backbone = require('backbone');

module.exports = function (opts) {
  // get the min value
  var minValue = parseFloat(opts.min) || 0;
  var maxValue = parseFloat(opts.max) || 0;
  var err = {
    type: opts.type,
    message: _t('components.backbone-forms.interval-error', { minValue: opts.min, maxValue: opts.max })
  };
  return function interval (value, attrs) {
    var fieldValue = 0;

    if (value === null || value === undefined || value === '') return err;

    // check if the value is number
    if (!isNaN(parseFloat(value)) && isFinite(value)) {
      fieldValue = parseFloat(value);
    }
    if (minValue > fieldValue || maxValue < fieldValue) {
      return err;
    }
    return;
  };
};
