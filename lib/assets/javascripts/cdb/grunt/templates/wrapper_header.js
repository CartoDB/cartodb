// cartodb.js version: <%= version %>
// uncompressed version: cartodb.uncompressed.js
// sha: <%= sha %>
(function() {
  var define;  // Undefine define (require.js), see https://github.com/CartoDB/cartodb.js/issues/543
  var root = this;

  if(!<%= load_jquery %>) {
    if(root.jQuery === undefined) {
      throw "jQuery should be loaded before include cartodb.js";
    }
  }

  // save current libraries
  var __prev = {
    jQuery: root.jQuery,
    $: root.$,
    L: root.L,
    Mustache: root.Mustache,
    Backbone: root.Backbone,
    _: root._
  };