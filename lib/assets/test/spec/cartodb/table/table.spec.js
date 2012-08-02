/*
describe("Table", function() {
  var table_response = '{"id":53,"name":"test_3","privacy":"PUBLIC","tags":"","schema":[["cartodb_id","number"],["the_geom","geometry","geometry","multipolygon"],["area","number"],["fips","string"],["iso2","string"],["iso3","string"],["lat","number"],["lon","number"],["name","string"],["pop2005","number"],["region","number"],["subregion","number"],["un","number"],["created_at","date"],["updated_at","date"]],"updated_at":"2012-07-25T08:45:41+02:00","rows_counted":246,"map_id":12,"table_size":516096}';

  beforeEach(function() {
    // a global table_id need to be defined
    // it is rendered by rails app into the template
    this.server = sinon.fakeServer.create();
  });

  afterEach(function() {
    this.server.restore();
  });


  it("should fetch the table", function() {
    var callback = sinon.spy();

    this.server.respondWith("GET", "/api/v1/tables/53",
      [200, {"Content-Type": "application/json"}, table_response]);
      var table = new cdb._test.Table({
        table_id: '53'
    });

  });

});
*/
