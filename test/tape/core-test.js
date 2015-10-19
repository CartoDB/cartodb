var test = require('tape');
var cartodb = require('../../src-browserify/core');

test('core: cartodb object', function(t) {
  t.plan(11);

  t.ok(cartodb, 'cartodb object should be defined');
  t.ok(cartodb._Promise, 'cartodb._Promise should be defined');

  t.ok(cartodb.core, 'a cartodb.core object should be defined');
  t.ok(cartodb.core.Profiler, 'a Profiler function should be defined');
  t.ok(cartodb.core.util, 'a util object should be defined');
  t.ok(cartodb.core.Loader, 'a Loader object should be defined');

  t.ok(cartodb.vis, 'a cartodb.vis object should be defined');
  t.ok(cartodb.vis.Loader, 'a Loader object should be defined');

  t.ok(cartodb.Image, 'a Image object should be defined');

  t.ok(cartodb.SQL, 'a SQL object should be defined');
  t.ok(cartodb.Tiles, 'a Tiles object should be defined');
});

test('core: cartodb object in a browser env', function(t) {
  t.plan(1);

  t.same(window.cartodb, cartodb, 'window.cartodb should be the same object as returned in require call');
});

test('core: window modifications', function(t) {
  t.plan(7);

  t.ok(window.cartodb, 'cartodb should be defined');
  t.ok(window._, 'underscore-isch should be set in global namespace');
  t.ok(window.Backbone, 'a fake Backbone object should be set in global namespace');
  t.ok(window.Backbone.Events, 'a fake Backbone object should be defined on global Backbone object');
  t.ok(window.JST, 'a JST (for templates) object should be set in global namespace');
  t.ok(window.reqwest, 'a reqwest lib should be set in global namespace (required by api/sql.js at runtime)');
  t.ok(window.vizjson, 'a vizjson function should be set in global namespace');
})
