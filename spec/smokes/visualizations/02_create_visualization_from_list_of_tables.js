var configuration = require("./spec/smokes/configuration");
var tables = require("./spec/smokes/helpers/table");

var url     = configuration.BASE_URL + '/api/v1/viz';
var payload = {
  name:   'Visualization',
  tables:   ['table1', 'table2']
};

var headers = {
  'Host'        : configuration.HOST,
  'Content-Type': 'application/json',
  'Accept'      : 'application/json'
};

casper.echo(configuration.HOST);
casper.start();

casper.thenOpen(tools.auth(url), { 
  method:   'post',
  data:     JSON.stringify(payload),
  headers:  headers
}).then(function() {
  this.test.assertHttpStatus(404, "Create visualization from non-existing table should fail");
});

tables.removeAllTables();

var table = new tables.Table();
table.create();


casper.thenOpen(tools.auth(url), {
  method: 'post',
  data: JSON.stringify({name:   'Visualization', tables: [table.tableName]}),
  headers: headers
})
casper.then(function() {
  this.test.assertHttpStatus(200, "Visualization from new table should be created");
})

tables.removeAllTables();

casper.run(function() {
  casper.test.done(2);
});

