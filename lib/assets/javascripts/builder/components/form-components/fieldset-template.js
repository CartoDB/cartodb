var Backbone = require('backbone');
var _ = require('underscore');

// overwirte template in order to be able to use flex
/* eslint-disable */
Backbone.Form.Fieldset.template = _.template('\
  <div class="Editor-fieldset" data-fields>\
    <% if (legend) { %>\
      <legend><%= legend %></legend>\
    <% } %>\
  </div>\
');
/* eslint-enable */
