const Backbone = require('backbone');
const SQLViewDataModel = require('dashboard/data/table/sqlviewdata-model');
const configModel = require('fixtures/dashboard/config-model.fixture');
const wkbPoint = '0101000020110F00004E3CE77C32B324418662B3BD88715841';
const wkbPolygon = '0106000020E61000000100000001030000000100000016000000000000C0D4211740000000A07DC34840000000C0285C1740000000E0AEC6484000000000BF98174000000060D5D44840000000A03F48174000000020E4DF48400000000096FC164000000060CBE54840000000C06903174000000000B1EC484000000060A8EC16400000008073F2484000000060BB3B17400000006005FB48400000000065471740000000203E0149400000002085EB1740000000000B16494000000080826D1840000000207915494000000040FF861840000000601110494000000040138F18400000004092FF484000000080814E1940000000A07BEB484000000060C1161A4000000020D2E74840000000E0CE0A1A40000000A06ADA484000000060707D1940000000A08DCB484000000000EA721940000000A0E0BA4840000000603EA91840000000609AC0484000000000F1EC17400000008062B948400000000074DA17400000004081BE4840000000C0D4211740000000A07DC34840';

describe('dashboard/data/table/sqlviewdata-model', function () {
  let sqlView;

  beforeEach(function () {
    sqlView = new SQLViewDataModel(null, { sql: 'select * from a', configModel });
  });

  it('default order should be empty after set sql', function () {
    sqlView.setSQL('select * from table');
    expect(sqlView.options.get('order_by')).toEqual('');
    expect(sqlView.options.get('sort_order')).toEqual('asc');
    expect(sqlView.options.get('filter_column')).toEqual('');
    expect(sqlView.options.get('filter_value')).toEqual('');
    expect(sqlView.options.get('page')).toEqual(0);
  });

  it('should guess geometry type', function () {
    sqlView.reset({ the_geom: wkbPoint });
    expect(sqlView.getGeometryTypes()).toEqual(['ST_Point']);

    sqlView.reset({ the_geom: wkbPolygon });
    expect(sqlView.getGeometryTypes()).toEqual(['ST_Multipolygon']);

    sqlView.reset({ the_geom_webmercator: wkbPoint });
    expect(sqlView.getGeometryTypes()).toEqual(['ST_Point']);

    sqlView.reset({ the_geom_webmercator: wkbPolygon });
    expect(sqlView.getGeometryTypes()).toEqual(['ST_Multipolygon']);

    // precedence
    sqlView.reset({ the_geom: wkbPolygon, the_geom_webmercator: wkbPoint });
    expect(sqlView.getGeometryTypes()).toEqual(['ST_Multipolygon']);

    sqlView.reset([
      { the_geom: null },
      { the_geom: null },
      null,
      { the_geom: wkbPoint },
      { the_geom: null }
    ]);
    expect(sqlView.getGeometryTypes()).toEqual(['ST_Point']);
  });

  it('should return true if has georeferenced data', function () {
    sqlView.reset([
      {the_geom: '{"type":"Point","coordinates":[-5.84198,43.648001]}'}
    ]);
    expect(sqlView.isGeoreferenced()).toEqual(true);
  });

  it("should return false if hasn't any georeferenced data", function () {
    sqlView.reset([
      {r: 1}
    ]);
    expect(sqlView.isGeoreferenced()).toEqual(false);
  });

  it('should raise change:sql always', function () {
    var c = 0;
    sqlView.options.bind('change:sql', function () {
      ++c;
    });
    sqlView.setSQL('select * from test');
    sqlView.setSQL('select * from test');
    sqlView.setSQL('select * from test2');
    expect(c).toEqual(3);
  });

  it('should not set null sql', function () {
    sqlView.setSQL(null);
    expect(sqlView.options.get('sql')).toEqual('');
  });

  it('should replace variables like {x},{y},{z} by a 0', function () {
    sqlView.setSQL('select {x}, {y}, {z} as aaa from table');
    expect(sqlView.options.get('sql')).toEqual('select 0, 0, 0 as aaa from table');
    sqlView.setSQL('select \\{x} as aaa from table');
    expect(sqlView.options.get('sql')).toEqual('select {x} as aaa from table');
  });

  it('should be read only when a filter has been applied', function () {
    sqlView.setSQL('select {x}, {y}, {z} as aaa from table');
    expect(sqlView.isReadOnly()).toBeTruthy();

    sqlView.options.set('sql_source', 'filters');

    expect(sqlView.isReadOnly()).toBeFalsy();
  });

  it('should reset rows when fails', function () {
    sqlView.reset([{a: 1, b: 2}]);
    expect(sqlView.size()).toEqual(1);

    const spy = jasmine.createSpy();

    sqlView.bind('reset', spy);
    sqlView.trigger('error');

    expect(spy).toHaveBeenCalled();
    expect(sqlView.size()).toEqual(0);
  });

  it('fech should use POST when the query is longer than 1024 bytes', function () {
    spyOn(sqlView, '_sqlQuery');
    var sql = 'select * from table limit ';
    while (sql.length < 1024 + 1) {
      sql += '0';
    }
    sqlView.setSQL(sql);
    sqlView.fetch();
    expect(sqlView._sqlQuery.calls.argsFor(0)[3]).toEqual('POST');
  });

  it('write queries should not fetch metadata', function () {
    sqlView.url = 'test';
    spyOn(sqlView, '_sqlQuery');
    sqlView.setSQL('update table set a = 1');
    sqlView.fetch();
    expect(sqlView._sqlQuery).not.toHaveBeenCalled();
    sqlView.setSQL('select * from table');
    sqlView.fetch();
    expect(sqlView._sqlQuery).toHaveBeenCalled();
  });

  it('write queries should use post', function () {
    spyOn(Backbone, 'sync');
    sqlView.setSQL('update table set a = 1');
    sqlView.sync();
    expect(Backbone.sync.calls.argsFor(0)[2].type).toEqual('POST');
  });

  it("should explicitly add 'as' to aliases", function () {
    spyOn(sqlView, '_sqlQuery');
    sqlView.setSQL('SELECT the_geom as location FROM testTable');
    sqlView.fetch();
    // expect(sqlView._sqlQuery).toHaveBeenCalled();
    // expect(sqlView._sqlQuery).toHaveBeenCalledWith("select * from (SELECT the_geom as location FROM testTable) __wrapped limit 0", Function, Function, 'GET');
    expect(sqlView._sqlQuery.calls.mostRecent().args[0]).toEqual('select * from (SELECT the_geom as location FROM testTable) __wrapped limit 0', Function, Function, 'GET');
    // expect(sqlView._sqlQuery).toEqual;
  });
});
