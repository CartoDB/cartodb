var configuration = require("./spec/smokes/configuration")

var authenticated = function(url) {
  return(url + "?api_key=" + configuration.API_KEY);
}

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

casper.open(authenticated(url), { 
  method:   'post',
  data:     JSON.stringify(payload),
  headers:  headers
});

casper.then(function() {
  response = JSON.parse(casper.getPageContent());
  casper.test.assertEquals(response['name'], payload['name']);
  require('utils').dump(response);
});

casper.run();

