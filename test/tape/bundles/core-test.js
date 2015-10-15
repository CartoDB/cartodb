var test = require('tape');
var cartodb = require('../../../src-browserify/core');

test('core: cartodb object', function(t) {
  t.plan(2);
  t.equal(typeof cartodb, 'object', 'cartodb should be defined in global scope');
  t.equal(typeof cartodb._Promise, 'function', 'cartodb._Promise should be defined');
});

if (typeof window !== 'undefined') {
  test('core: cartodb object in a browser env', function(t) {
    t.plan(4);
    t.equal(typeof window._, 'object', 'underscore-isch should be set in global scope');
    t.equal(typeof window.Backbone, 'object', 'a fake Backbone object should be set');
    t.equal(typeof window.Backbone.Events, 'object', 'a fake Backbone object should be set');
    t.equal(typeof window.JST, 'object', 'a JST (for templates) object should be set');
  });
}
