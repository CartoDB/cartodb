var test = require('tape');
var cartodb = require('../../src-browserify/core');

test('core: cartodb object', function(t) {
  t.plan(4);

  t.equal(typeof cartodb, 'object', 'cartodb object should be defined');
  t.equal(typeof cartodb._Promise, 'function', 'cartodb._Promise should be defined');

  t.equal(typeof cartodb.core, 'object', 'a core object should be defined');
  t.equal(typeof cartodb.core.Profiler, 'function', 'a Profiler function should be defined');
});

if (typeof window !== 'undefined') {
  test('core: cartodb object in a browser env', function(t) {
    t.plan(5);

    t.equal(typeof window.cartodb, 'object', 'cartodb should be defined');
    t.equal(typeof window._, 'object', 'underscore-isch should be set in global namespace');
    t.equal(typeof window.Backbone, 'object', 'a fake Backbone object should be set in global namespace');
    t.equal(typeof window.Backbone.Events, 'object', 'a fake Backbone object should be defined on global Backbone object');
    t.equal(typeof window.JST, 'object', 'a JST (for templates) object should be set in global namespace');
  });
}
