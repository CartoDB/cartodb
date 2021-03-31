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
    columnType: require('./validators/column-type'),
    interval: require('./validators/interval'),
    requiredBoolean: require('./validators/required-boolean')
  }
);

Backbone.Form.Original = Backbone.Form;

// Requiring custom form components
require('./form');
require('./fieldset-template');
require('./field');
require('./editors/base');
require('./editors/text');
require('./editors/textarea');
require('./editors/number/number');
require('./editors/select/select-view');
require('./editors/select/select-placeholder');
require('./editors/select/multi-select-view');
require('./editors/radio/radio');
require('./editors/enabler/enabler-view');
require('./editors/toggle/toggle');
require('./editors/enabler-editor/enabler-editor-view');
require('./editors/node-dataset/node-dataset-view');
require('./editors/operators/operators-view');
require('./editors/list/list');
require('./editors/list/list-item');
require('./editors/sortable-list');
require('./editors/legend/category-item');
require('./editors/slider/slider');
require('./editors/fill/fill');
require('./editors/fill-color/fill-color');
require('./editors/size/size');
require('./editors/taglist/taglist');
require('./editors/datetime/datetime');
require('./editors/select/suggest-view');
require('./editors/code-editor');
require('./editors/lazy-select/lazy-select-view');
