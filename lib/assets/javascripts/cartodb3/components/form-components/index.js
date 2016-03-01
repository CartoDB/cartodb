var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;

// Requiring custom form components
require('./field.js');
require('./editors/text.js');
require('./editors/radio.js');
require('./editors/select.js');
require('./editors/number.js');
require('./editors/textarea.js');
