var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;

// Custom validators
_.extend(
  Backbone.Form.validators,
  {
    interval: require('./validators/interval.js')
  }
);

// Requiring custom form components
require('./fieldset-template.js');
require('./field.js');
require('./editors/base.js');
require('./editors/enabler/enabler-view.js');
require('./editors/text.js');
require('./editors/radio.js');
require('./editors/select/select-view.js');
require('./editors/enabler-editor/enabler-editor-view.js');
require('./editors/select/multi-select-view.js');
require('./editors/node-dataset/node-dataset-view.js');
require('./editors/operators/operators-view.js');
require('./editors/list/list.js');
require('./editors/list/list-item.js');
require('./editors/sortable-list.js');
require('./editors/legend/category-item.js');
require('./editors/number.js');
require('./editors/textarea.js');
require('./editors/fill.js');
require('./editors/taglist.js');
