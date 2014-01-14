
describe('SQL api client', function() {
  var USER = 'rambo';
  var TEST_DATA = { test: 'good' };
  var sql;
  var ajaxParams;
  var throwError = false;
  var jquery_ajax;
  var ajax;
  beforeEach(function() {
    ajaxParams = null;
    ajax = function(params) {
      ajaxParams = params;
      _.defer(function() {
        if(!throwError && params.success) params.success(TEST_DATA, 200);
        throwError && params.error && params.error({
          responseText: JSON.stringify({
            error: ['jaja']
          })
        });
      });
    }
    sql = new cartodb.SQL({
      user: USER,
      protocol: 'https',
      ajax: ajax
    })

    jquery_ajax = $.ajax;
  });

  afterEach(function() {
    $.ajax = jquery_ajax;
  });

  it("should compile the url if not completeDomain passed", function() {
    expect(sql._host()).toEqual('https://rambo.cartodb.com/api/v2/sql');
  });

  it("should compile the url if completeDomain passed", function() {
    var sqlBis = new cartodb.SQL({
      user: USER,
      protocol: 'https',
      completeDomain: 'http://troloroloro.com'
    })

    expect(sqlBis._host()).toEqual('http://troloroloro.com/api/v2/sql');
  });


  it("should execute a query", function() {
    sql.execute('select * from table');
    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.cartodb.com/api/v2/sql?q=' + encodeURIComponent('select * from table')
    )
    expect(ajaxParams.type).toEqual('get');
    expect(ajaxParams.dataType).toEqual('json');
    expect(ajaxParams.crossDomain).toEqual(true);
  });

  it("should parse template", function() {
    sql.execute('select * from {{table}}', {
      table: 'rambo'
    })
    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.cartodb.com/api/v2/sql?q=' + encodeURIComponent('select * from rambo')
    )
  });

  it("should substitute mapnik tokens", function() {
    sql.execute('select !pixel_width! as w, !pixel_height! as h, !bbox! as b from {{table}}', {
      table: 't'
    })

    var earth_circumference = 40075017;
    var tile_size = 256;
    var srid = 3857;
    var full_resolution = earth_circumference/tile_size;
    var shift = earth_circumference / 2.0;

    var pw = full_resolution; 
    var ph = pw;
    var bbox = 'ST_MakeEnvelope(' + (-shift) + ',' + (-shift) + ','
                                  + shift + ',' + shift + ',' + srid + ')';

    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.cartodb.com/api/v2/sql?q=' + encodeURIComponent(
        'select ' + pw + ' as w, ' + ph + ' as h, '
        + bbox + ' as b from t')
    )
  });

  it("should call promise", function() {
    var data;
    var data_callback;
    runs(function() {
      sql.execute('select * from bla', function(data) { data_callback = data }).done(function(d) {
        data = d;
      });
    });
    waits(1);
    runs(function() {
      expect(data).toEqual(TEST_DATA);
      expect(data_callback).toEqual(TEST_DATA);
    });
  });
  it("should call promise on error", function() {
    throwError = true;
    var err = false;
    runs(function() {
      sql.execute('select * from bla').error(function(d) {
        err = true;
      });
    });
    waits(10);
    runs(function() {
      expect(err).toEqual(true);
    });
  });

  it("should include url params", function() {
    s = new cartodb.SQL({
      user: 'rambo',
      format: 'geojson',
      protocol: 'http',
      host: 'charlies.com',
      api_key: 'testkey',
      rambo: 'test',
      ajax: ajax
    })
    s.execute('select * from rambo', null, {
      dp: 2
    })
    expect(ajaxParams.url.indexOf('http://')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('rambo.charlies.com')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&format=geojson')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&api_key=testkey')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&dp=2')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&rambo')).toEqual(-1);
  });

  it("should include extra url params", function() {
    s = new cartodb.SQL({
      user: 'rambo',
      format: 'geojson',
      protocol: 'http',
      host: 'charlies.com',
      api_key: 'testkey',
      rambo: 'test',
      ajax: ajax,
      extra_params: ['rambo']
    })
    s.execute('select * from rambo', null, {
      dp: 2
    })
    expect(ajaxParams.url.indexOf('http://')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('rambo.charlies.com')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&format=geojson')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&api_key=testkey')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&dp=2')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&rambo=test')).not.toEqual(-1);

    s.execute('select * from rambo', null, {
      dp: 2,
      rambo: 'test2'
    })
    expect(ajaxParams.url.indexOf('&rambo=test2')).not.toEqual(-1);
  });


  it("should use jsonp if browser does not support cors", function() {
    $.support.cors = false;
    s = new cartodb.SQL({ user: 'jaja', ajax: ajax });
    expect(s.options.jsonp).toEqual(true);
    s.execute('select * from rambo', null, {
      dp: 2
    })
    expect(ajaxParams.dataType).toEqual('jsonp');
    expect(ajaxParams.crossDomain).toEqual(undefined);
    expect(ajaxParams.jsonp).toEqual(undefined);
    $.support.cors = true;
  });

  it("should get bounds for query", function() {
    var sql = 'SELECT ST_XMin(ST_Extent(the_geom)) as minx,' +
            '       ST_YMin(ST_Extent(the_geom)) as miny,'+
            '       ST_XMax(ST_Extent(the_geom)) as maxx,' +
            '       ST_YMax(ST_Extent(the_geom)) as maxy' +
            ' from (select * from rambo where id=2) as subq';
    s = new cartodb.SQL({ user: 'jaja', ajax: ajax });
    s.getBounds('select * from rambo where id={{id}}', {id: 2});
    expect(ajaxParams.url.indexOf(encodeURIComponent(sql))).not.toEqual(-1);
  });

  it("should get bounds for query with appostrophes", function() {
    s = new cartodb.SQL({ user: 'jaja', ajax: ajax });
    s.getBounds("select * from country where name={{ name }}", { name: "'Spain'"});
    expect(ajaxParams.url.indexOf("%26amp%3B%2339%3B")).toEqual(-1);
  });
});

describe('sql.table', function() {
  var USER = 'rambo';
  var sql;
  beforeEach(function() {
    ajaxParams = null;
    sql = new cartodb.SQL({
      user: USER,
      protocol: 'https'
    })
  });

  it("sql", function() {
    var s = sql.table('test');
    expect(s.sql()).toEqual('select * from test');
    s.columns(['age', 'jeta'])
    expect(s.sql()).toEqual('select age,jeta from test');
    s.filter('age < 10')
    expect(s.sql()).toEqual('select age,jeta from test where age < 10');
    s.limit(15)
    expect(s.sql()).toEqual('select age,jeta from test where age < 10 limit 15');
    s.order_by('age')
    expect(s.sql()).toEqual('select age,jeta from test where age < 10 limit 15 order by age');
  })

});
