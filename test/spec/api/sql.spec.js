var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var SQL = require('../../../src/api/sql');

describe('api/sql', function () {
  var USER = 'cartojs-test';
  var sql;
  var ajax;
  var ajaxParams;
  var TEST_DATA = { test: 'good' };
  var NO_BOUNDS = { 'rows': [
    { 'maxx': null }
  ]};
  var throwError;
  var abort = jasmine.createSpy('abort');

  beforeEach(function () {
    jasmine.clock().install();

    ajaxParams = null;
    ajax = function (params) {
      ajaxParams = params;
      _.defer(function () {
        params.complete && params.complete();
        if (!throwError && params.success) params.success(TEST_DATA, 200);
        throwError && params.error && params.error({
          responseText: JSON.stringify({
            error: ['jaja']
          })
        });
      });

      return {
        abort: abort
      };
    };

    spyOn($, 'ajax').and.callFake(ajax);

    sql = new SQL({
      user: USER,
      protocol: 'https'
    });
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  it('should compile the url if not completeDomain passed', function () {
    expect(sql._host()).toEqual('https://cartojs-test.carto.com/api/v2/sql');
  });

  it('should compile the url if completeDomain passed', function () {
    var sqlBis = new SQL({
      user: USER,
      protocol: 'https',
      completeDomain: 'http://troloroloro.com'
    });

    expect(sqlBis._host()).toEqual('http://troloroloro.com/api/v2/sql');
  });

  it('should execute a query', function () {
    sql.execute('select * from table');
    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.carto.com/api/v2/sql?q=' + encodeURIComponent('select * from table')
    );
    expect(ajaxParams.type).toEqual('get');
    expect(ajaxParams.dataType).toEqual('json');
    expect(ajaxParams.crossDomain).toEqual(true);
  });

  it('should be abortable', function () {
    sql = new SQL({
      user: USER,
      protocol: 'https',
      abortable: true
    });

    sql.execute('select * from table');
    expect(abort).not.toHaveBeenCalled();

    sql.execute('select * from table limit 10');
    expect(abort).toHaveBeenCalled();
  });

  it('should parse template', function () {
    sql.execute('select * from {{table}}', {
      table: 'cartojs-test'
    });
    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.carto.com/api/v2/sql?q=' + encodeURIComponent('select * from cartojs-test')
    );
  });

  it('should execute a long query', function () {
    // Generating a giant query
    var longSQL = [];
    var i = 2000;
    while (--i) longSQL.push('10000');
    var longQuery = 'SELECT * ' + longSQL;

    // required to have jquery as transport, is checked in the execute method
    sql.execute(longQuery);

    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.carto.com/api/v2/sql'
    );

    expect(ajaxParams.data.q).toEqual(longQuery);
    expect(ajaxParams.type).toEqual('post');
    expect(ajaxParams.dataType).toEqual('json');
    expect(ajaxParams.crossDomain).toEqual(true);
  });

  it('should execute a long query with params', function () {
    var s = new SQL({
      user: 'cartojs-test',
      format: 'geojson',
      protocol: 'http',
      host: 'charlies.com',
      api_key: 'testkey',
      'cartojs-test': 'test'
    });

    // Generating a giant query
    var longSQL = [];
    var i = 2000;
    while (--i) longSQL.push('10000');
    var longQuery = 'SELECT * ' + longSQL;

    s.execute(longQuery, null, {
      dp: 0
    });

    expect(ajaxParams.url.indexOf('http://')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('cartojs-test.charlies.com')).not.toEqual(-1);
    // Check that we don't have params in the URI
    expect(ajaxParams.url.indexOf('&format=geojson')).toEqual(-1);
    expect(ajaxParams.url.indexOf('&api_key=testkey')).toEqual(-1);
    expect(ajaxParams.url.indexOf('&dp=2')).toEqual(-1);
    expect(ajaxParams.url.indexOf('&cartojs-test')).toEqual(-1);
    // Check that we have the params in the body
    expect(ajaxParams.data.q).toEqual(longQuery);
    expect(ajaxParams.data.format).toEqual('geojson');
    expect(ajaxParams.data.api_key).toEqual('testkey');
    expect(ajaxParams.data.dp).toEqual(0);
    expect(ajaxParams['cartojs-test']).toEqual('test');
  });

  it('should substitute mapnik tokens', function () {
    sql.execute('select !pixel_width! as w, !pixel_height! as h, !bbox! as b from {{table}}', {
      table: 't'
    });

    var earthCircumference = 40075017;
    var tileSize = 256;
    var srid = 3857;
    var fullResolution = earthCircumference / tileSize;
    var shift = earthCircumference / 2.0;

    var pw = fullResolution;
    var ph = pw;
    var bbox = 'ST_MakeEnvelope(' + (-shift) + ',' + (-shift) + ',' +
                                  shift + ',' + shift + ',' + srid + ')';

    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.carto.com/api/v2/sql?q=' + encodeURIComponent(
        'select ' + pw + ' as w, ' + ph + ' as h, ' +
        bbox + ' as b from t')
    );
  });

  it('should call promise', function () {
    var data;
    var dataCallback;

    sql.execute('select * from bla', function (e, data) {
      dataCallback = data;
    }).done(function (d) {
      data = d;
    });

    jasmine.clock().tick(100);

    expect(data).toEqual(TEST_DATA);
    expect(dataCallback).toEqual(TEST_DATA);
  });

  it('should call promise on error', function () {
    throwError = true;
    var err = false;

    sql.execute('select * from bla').error(function () {
      err = true;
    });

    jasmine.clock().tick(10);
    expect(err).toEqual(true);
  });

  it('should include url params', function () {
    var s = new SQL({
      user: 'cartojs-test',
      format: 'geojson',
      protocol: 'http',
      host: 'charlies.com',
      api_key: 'testkey',
      'cartojs-test': 'test'
    });
    s.execute('select * from cartojs-test', null, {
      dp: 2
    });
    expect(ajaxParams.url.indexOf('http://')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('cartojs-test.charlies.com')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&format=geojson')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&api_key=testkey')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&dp=2')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&cartojs-test')).toEqual(-1);
  });

  it('should include extra url params', function () {
    var s = new SQL({
      user: 'cartojs-test',
      format: 'geojson',
      protocol: 'http',
      host: 'charlies.com',
      api_key: 'testkey',
      'cartojs-test': 'test',
      extra_params: ['cartojs-test']
    });
    s.execute('select * from cartojs-test', null, {
      dp: 2
    });
    expect(ajaxParams.url.indexOf('http://')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('cartojs-test.charlies.com')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&format=geojson')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&api_key=testkey')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&dp=2')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&cartojs-test=test')).not.toEqual(-1);

    s.execute('select * from cartojs-test', null, {
      dp: 2,
      'cartojs-test': 'test2'
    });
    expect(ajaxParams.url.indexOf('&cartojs-test=test2')).not.toEqual(-1);
  });

  it('should use jsonp if browser does not support cors', function () {
    var corsPrev = $.support.cors;
    $.support.cors = false;
    var s = new SQL({ user: 'jaja' });
    expect(s.options.jsonp).toEqual(true);
    s.execute('select * from cartojs-test', null, {
      dp: 2,
      jsonpCallback: 'test_callback',
      cache: false
    });
    expect(ajaxParams.dataType).toEqual('jsonp');
    expect(ajaxParams.crossDomain).toEqual(undefined);
    expect(ajaxParams.jsonp).toEqual(undefined);
    expect(ajaxParams.jsonpCallback).toEqual('test_callback');
    expect(ajaxParams.cache).toEqual(false);
    $.support.cors = corsPrev;
  });

  describe('.getBounds', function () {
    it('should get bounds for query', function () {
      var sql = 'SELECT ST_XMin(ST_Extent(the_geom)) as minx,' +
              '       ST_YMin(ST_Extent(the_geom)) as miny,' +
              '       ST_XMax(ST_Extent(the_geom)) as maxx,' +
              '       ST_YMax(ST_Extent(the_geom)) as maxy' +
              ' from (select * from cartojs-test where id=2) as subq';
      var s = new SQL({ user: 'jaja' });
      s.getBounds('select * from cartojs-test where id={{id}}', {id: 2});
      expect(ajaxParams.url.indexOf(encodeURIComponent(sql))).not.toEqual(-1);
    });

    it('should get bounds for query with appostrophes', function () {
      var s = new SQL({ user: 'jaja' });
      s.getBounds('select * from country where name={{ name }}', {name: "'Spain'"});
      expect(ajaxParams.url.indexOf('%26amp%3B%2339%3B')).toEqual(-1);
    });

    it('should resolve promise as error in case there are no bounds', function () {
      var prevTestData = TEST_DATA;
      var actualErrors = null;
      TEST_DATA = NO_BOUNDS;
      throwError = false;

      var s = new SQL({ user: 'jaja' });
      s.getBounds('SELECT * FROM somewhere')
        .error(function (err) {
          actualErrors = err;
        });

      jasmine.clock().tick(10);
      expect(actualErrors).not.toBeNull();
      expect(actualErrors.length).toBe(1);
      expect(actualErrors[0]).toEqual('No bounds');

      // Cleaning
      TEST_DATA = prevTestData;
    });

    it('should trigger the error callback in case there are no bounds', function () {
      var prevTestData = TEST_DATA;
      var actualErrors = null;
      TEST_DATA = NO_BOUNDS;
      throwError = false;

      function cb (err) {
        actualErrors = err;
      }

      var s = new SQL({ user: 'jaja' });
      s.getBounds('SELECT * FROM somewhere', null, null, cb);

      jasmine.clock().tick(10);
      expect(actualErrors).not.toBeNull();
      expect(actualErrors.length).toBe(1);
      expect(actualErrors[0]).toEqual('No bounds');

      // Cleaning
      TEST_DATA = prevTestData;
    });
  });
});

describe('api/sql.table', function () {
  var USER = 'cartojs-test';
  var sql;

  beforeEach(function () {
    sql = new SQL({
      user: USER,
      protocol: 'https'
    });
  });

  it('sql', function () {
    var s = sql.table('test');
    expect(s.sql()).toEqual('select * from test');
    s.columns(['age', 'jeta']);
    expect(s.sql()).toEqual('select age,jeta from test');
    s.filter('age < 10');
    expect(s.sql()).toEqual('select age,jeta from test where age < 10');
    s.limit(15);
    expect(s.sql()).toEqual('select age,jeta from test where age < 10 limit 15');
    s.order_by('age');
    expect(s.sql()).toEqual('select age,jeta from test where age < 10 limit 15 order by age');
  });
});

describe('api/sql column descriptions', function () {
  var USER = 'manolo';
  var sql;

  beforeAll(function () {
    this.colDate = new Backbone.Model(JSON.parse('{"name":"object_postedtime","type":"date","geometry_type":"point","bbox":[[-28.92163128242129,-201.09375],[75.84516854027044,196.875]],"analyzed":true,"success":true,"stats":{"type":"date","start_time":"2015-02-19T15:13:16.000Z","end_time":"2015-02-22T04:34:05.000Z","range":220849000,"steps":1024,"null_ratio":0,"column":"object_postedtime"}}'));
    this.colFloat = new Backbone.Model(JSON.parse('{"name":"asdfd","type":"number","geometry_type":"point"}'));
    this.colString = new Backbone.Model(JSON.parse('{"name":"asdfd","type":"string","geometry_type":"point"}'));
    this.colGeom = new Backbone.Model(JSON.parse('{"name":"asdfd","type":"geometry","geometry_type":"point"}'));
    this.colBoolean = new Backbone.Model(JSON.parse('{"name":"asdfd","type":"boolean","geometry_type":"point"}'));
    this.query = 'SELECT * FROM whatevs';

    sql = new SQL({
      user: USER,
      protocol: 'https'
    });
    sql.execute = function (sql, callback) {
      callback(null, {});
    };
  });

  it('should deduct correct describe method', function () {
    spyOn(sql, 'describeDate');
    sql.describe(this.query, this.colDate, {type: this.colDate.get('type')}, function () {});
    expect(sql.describeDate).toHaveBeenCalled();

    spyOn(sql, 'describeFloat');
    sql.describe(this.query, this.colFloat, {type: this.colFloat.get('type')}, function () {});
    expect(sql.describeFloat).toHaveBeenCalled();

    spyOn(sql, 'describeString');
    sql.describe(this.query, this.colString, {type: this.colString.get('type')}, function () {});
    expect(sql.describeString).toHaveBeenCalled();

    spyOn(sql, 'describeGeom');
    sql.describe(this.query, this.colGeom, {type: this.colGeom.get('type')}, function () {});
    expect(sql.describeGeom).toHaveBeenCalled();

    spyOn(sql, 'describeBoolean');
    sql.describe(this.query, this.colBoolean, {type: this.colBoolean.get('type')}, function () {});
    expect(sql.describeBoolean).toHaveBeenCalled();
  });

  describe('string describer', function () {
    var description;
    beforeAll(function (done) {
      sql.execute = function (sql, callback) {
        var data = JSON.parse('{"rows":[{"uniq":462,"cnt":487,"null_count":1,"null_ratio":0.002053388090349076,"skew":0.043121149897330596,"array_agg":""}],"time":0.01,"fields":{"uniq":{"type":"number"},"cnt":{"type":"number"},"null_count":{"type":"number"},"null_ratio":{"type":"number"},"skew":{"type":"number"},"array_agg":{"type":"unknown(2287)"}},"total_rows":1}');
        callback(null, data);
      };
      var callback = function (e, stuff) {
        description = stuff;
        done();
      };
      sql.describeString(sql, this.colString, callback); // THE COLS DON'T MATCH!!!
    });

    it('should return correct properties', function () {
      expect(description.hist.constructor).toEqual(Array); // Right now it's an empty array because JSON.parse doesn't like our way of notating histograms
      expect(description.type).toEqual('string');
      expect(typeof description.null_count).toEqual('number');
      expect(typeof description.distinct).toEqual('number');
      expect(typeof description.null_ratio).toEqual('number');
      expect(typeof description.skew).toEqual('number');
      expect(typeof description.weight).toEqual('number');
    });
  });

  describe('geometry describer', function () {
    var description;
    beforeAll(function (done) {
      sql.execute = function (sql, callback) {
        var data = {'rows': [{'geometry_type': 'ST_Point'}], 'time': 0.035, 'fields': {'geometry_type': {'type': 'string'}}, 'total_rows': 1};
        callback(null, data);
      };
      var callback = function (e, stuff) {
        description = stuff;
        done();
      };
      sql.describeGeom(sql, this.colGeom, callback);
    });
    it('should return correct properties', function () {
      expect(description.type).toEqual('geom');
      expect(['ST_Point', 'ST_Line', 'ST_Polygon'].indexOf(description.geometry_type) > -1).toBe(true);
    });
  });

  describe('number describer', function () {
    var description;
    beforeAll(function (done) {
      sql.execute = function (sql, callback) {
        var data = JSON.parse('{"rows":[{"hist":"{\\"(1,empty,69368)\\",\\"(25,empty,11063)\\"}","min":0,"max":4,"avg":0.3745819397993311,"cnt":89401,"uniq":5,"null_ratio":0,"stddev":0.000009057366328792043,"stddevmean":2.1617223091836313,"dist_type":"U","quantiles":[0,1,2,2,3,4,4],"equalint":[0,0,0,0,0,0,0],"jenks":[0,1,2,3,4],"headtails":[0,1,2,3,4],"cat_hist":"{\\"(1,empty,69368)\\",\\"(25,empty,11063)\\"}"}],"time":1.442,"fields":{"hist":{"type":"unknown(2287)"},"min":{"type":"number"},"max":{"type":"number"},"avg":{"type":"number"},"cnt":{"type":"number"},"uniq":{"type":"number"},"null_ratio":{"type":"number"},"stddev":{"type":"number"},"stddevmean":{"type":"number"},"dist_type":{"type":"string"},"quantiles":{"type":"number[]"},"equalint":{"type":"number[]"},"jenks":{"type":"number[]"},"headtails":{"type":"number[]"},"cat_hist":{"type":"unknown(2287)"}},"total_rows":1}');
        callback(null, data);
      };
      var callback = function (e, stuff) {
        description = stuff;
        done();
      };
      sql.describeFloat(sql, this.colGeom, callback);
    });
    it('should return correct properties', function () {
      expect(description.type).toEqual('number');
      expect(['A', 'U', 'F', 'J'].indexOf(description.dist_type) > -1).toBe(true);
      var i;
      var numTypes = ['avg', 'max', 'min', 'stddevmean', 'weight', 'stddev', 'null_ratio', 'count'];
      for (i = 0; i < numTypes.length; i++) {
        expect(typeof description[numTypes[i]]).toEqual('number');
      }
      var arrayTypes = ['quantiles', 'equalint', 'jenks', 'headtails', 'cat_hist', 'hist'];
      for (i = 0; i < arrayTypes.length; i++) {
        expect(description[arrayTypes[i]].constructor).toEqual(Array);
      }
    });
  });

  describe('boolean describer', function () {
    var description;
    beforeAll(function (done) {
      sql.execute = function (sql, callback) {
        var data = {'rows': [
          {'true_ratio': 0.3377926421404682, 'null_ratio': 0, 'uniq': 2, 'cnt': 89401}
        ],
        'time': 0.251,
        'fields': {'true_ratio': {'type': 'number'}, 'null_ratio': {'type': 'number'}, 'uniq': {'type': 'number'}, 'cnt': {'type': 'number'}},
        'total_rows': 1
        };
        callback(null, data);
      };
      var callback = function (e, stuff) {
        description = stuff;
        done();
      };
      sql.describeBoolean(sql, this.colGeom, callback);
    });
    it('should return correct properties', function () {
      expect(description.type).toEqual('boolean');
      expect(typeof description.true_ratio).toEqual('number');
      expect(typeof description.distinct).toEqual('number');
      expect(typeof description.count).toEqual('number');
      expect(typeof description.null_ratio).toEqual('number');
    });
  });
});
