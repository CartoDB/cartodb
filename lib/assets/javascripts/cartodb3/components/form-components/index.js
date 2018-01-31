var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
require('backbone-forms');
require('rangeslider.js');
Backbone.$ = $;

// Custom validators
_.extend(
  Backbone.Form.validators,
  {
    columnType: require('./validators/column-type.js'),
    interval: require('./validators/interval.js'),
    requiredBoolean: require('./validators/required-boolean.js')
  }
);

Backbone.Form.Original = Backbone.Form;

// Requiring custom form components
require('./form.js');
require('./fieldset-template.js');
require('./field.js');
require('./editors/base.js');
require('./editors/text.js');
require('./editors/textarea.js');
require('./editors/number/number.js');
require('./editors/select/select-view.js');
require('./editors/select/select-placeholder.js');
require('./editors/select/multi-select-view.js');
require('./editors/radio/radio.js');
require('./editors/enabler/enabler-view.js');
require('./editors/toggle/toggle.js');
require('./editors/enabler-editor/enabler-editor-view.js');
require('./editors/node-dataset/node-dataset-view.js');
require('./editors/operators/operators-view.js');
require('./editors/list/list.js');
require('./editors/list/list-item.js');
require('./editors/sortable-list.js');
require('./editors/legend/category-item.js');
require('./editors/slider/slider.js');
require('./editors/fill/fill.js');
require('./editors/taglist/taglist.js');
require('./editors/datetime/datetime.js');
require('./editors/select/suggest-view.js');
require('./editors/code-editor');
require('./editors/data-observatory-measurements/data-observatory-measurements-view.js');
require('./editors/data-observatory-measurements/measurement-item.js');
require('./editors/lazy-select/lazy-select-view.js');
