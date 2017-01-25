
var old_init = cdb.init;
cdb.init = function() { old_init(); };
cdb.templates.namespace = 'cartodb/';

cdb.config.set({
  sql_api_port: 80,
  sql_api_domain: 'carto.com',
  sql_api_endpoint: '/api/v1/sql'
});
