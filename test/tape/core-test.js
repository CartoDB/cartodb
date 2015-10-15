var test = require('tape');
var cartodb = require('../../src-browserify/core');

test('core: cartodb object', function(t) {
  t.plan(5);

  t.ok(cartodb, 'cartodb object should be defined');
  t.ok(cartodb._Promise, 'cartodb._Promise should be defined');

  t.ok(cartodb.core, 'a core object should be defined');
  t.ok(cartodb.core.Profiler, 'a Profiler function should be defined');
  t.ok(cartodb.core.util, 'a util object should be defined');
});

if (typeof window !== 'undefined') {
  test('core: cartodb object in a browser env', function(t) {
    t.plan(5);

    t.ok(window.cartodb, 'cartodb should be defined');
    t.ok(window._, 'underscore-isch should be set in global namespace');
    t.ok(window.Backbone, 'a fake Backbone object should be set in global namespace');
    t.ok(window.Backbone.Events, 'a fake Backbone object should be defined on global Backbone object');
    t.ok(window.JST, 'a JST (for templates) object should be set in global namespace');
  });
}
