/**
 * Adds a new validator for Boolean fields, based on Form.validators.required
 */

module.exports = function (options) {
  options = _.extend({
    type: 'required',
    message: this.errMessages.required
  }, options);
   
  return function required(value) {
    options.value = value;
    
    var err = {
      type: options.type,
      message: _.isFunction(options.message) ? options.message(options) : options.message
    };
    
    if (value === undefined) return err;
  };
};
