
describe('SQL api client', function() {
  var USER = 'rambo';
  var TEST_DATA = { test: 'good' };
  var sql;
  var ajaxParams;
  var throwError = false;
  var jquery_ajax;
  beforeEach(function() {
    ajaxParams = null;
    sql = new cartodb.SQL({
      user: USER,
      protocol: 'https'
    })

    jquery_ajax = $.ajax;
    $.ajax = function(params) {

      ajaxParams = params;
      _.defer(function() {
        if(!throwError && params.success) params.success(TEST_DATA);
        throwError && params.error && params.error();
      });
    }
  });

  afterEach(function() {
    $.ajax = jquery_ajax;
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
    waits(1);
    runs(function() {
      expect(err).toEqual(true);
    });
  });

  it("should include url params", function() {
    s = new cartodb.SQL({
      user: 'rambo',
      format: 'geojson',
      protocol: 'http',
      host: 'charlies.com'
    })
    s.execute('select * from rambo', null, {
      dp: 2
    })
    expect(ajaxParams.url.indexOf('http://')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('rambo.charlies.com')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&format=geojson')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&dp=2')).not.toEqual(-1);
  });

  it("should use jsonp if browser does not support cors", function() {
    $.support.cors = false;
    s = new cartodb.SQL({ user: 'jaja' });
    expect(s.options.jsonp).toEqual(true);
    s.execute('select * from rambo', null, {
      dp: 2
    })
    expect(ajaxParams.dataType).toEqual('jsonp');
    expect(ajaxParams.crossDomain).toEqual(undefined);
    expect(ajaxParams.jsonp).toEqual(undefined);
    $.support.cors = true;
  });
});
