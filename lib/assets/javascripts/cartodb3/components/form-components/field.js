var Backbone = require('backbone');

Backbone.Form.Field = Backbone.Form.Field.extend({}, {
  template: require('./field.tpl'),
  errorClassName: 'has-error'
});
