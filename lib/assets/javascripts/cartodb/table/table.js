/**
 *  entry point for table
 */


$(function() {
  var Table = cdb.admin.TableEditorView;

  cdb._test = cdb._test || {};
  cdb._test.Table = Table;

  cdb.init(function() {
    cdb.config.set(config);
    cdb.config.set('api_key', user_data.api_key);
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', user_data.base_url);

    var currentUser = new cdb.admin.User(window.user_data);

    // Store JS errors
    var errors = new cdb.admin.ErrorStats({ user_data: user_data });

    // Main view
    var table = new Table({
      vis_data: vis_data,
      user_data: user_data,
      config: config,
      map_data: map_data,
      basemaps: basemaps || cdb.admin.DEFAULT_BASEMAPS
    });

    var metrics = new cdb.admin.Metrics();

    // expose to debug
    window.table = table;
    window.table_router = new cdb.admin.TableRouter(table);

    Backbone.history.start({
      pushState: true,
      root: cdb.config.prefixUrlPathname() + '/'
    });
  });

});
