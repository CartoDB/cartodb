var configuration = require("./spec/smokes/configuration")
var tools         = require("./spec/smokes/helpers/tools")

var url     = configuration.BASE_URL + '/api/v1/viz';
var payload = {
  name:   'Visualization',
  tags:   ['tag1', 'tag2'],
  map_id: 5
};

var headers = {
  'Host'        : configuration.HOST,
  'Content-Type': 'application/json',
  'Accept'      : 'application/json'
}

casper.echo(configuration.HOST)
casper.start()

casper.open(tools.auth(url), { 
  method:   'post',
  data:     JSON.stringify(payload),
  headers:  headers
});

casper.then(function() {
  response = JSON.parse(casper.getPageContent());
  casper.test.assertHttpStatus(200, "Visualization creation should return 200");
  casper.test.assertEquals(response['name'], payload['name'], "Visualization should be named as we wanted");
});

casper.run(function() {
  casper.test.done(2);
});

