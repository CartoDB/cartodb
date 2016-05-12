var geometry = require('../../../../javascripts/cartodb3/data/geometry');

describe('data/geometry', function () {
  beforeEach(function () {
    this.rawWKBPoint = '0101000020110F00004E3CE77C32B324418662B3BD88715841';
    this.rawWKBPolygon = '0106000020E61000000100000001030000000100000016000000000000C0D4211740000000A07DC34840000000C0285C1740000000E0AEC6484000000000BF98174000000060D5D44840000000A03F48174000000020E4DF48400000000096FC164000000060CBE54840000000C06903174000000000B1EC484000000060A8EC16400000008073F2484000000060BB3B17400000006005FB48400000000065471740000000203E0149400000002085EB1740000000000B16494000000080826D1840000000207915494000000040FF861840000000601110494000000040138F18400000004092FF484000000080814E1940000000A07BEB484000000060C1161A4000000020D2E74840000000E0CE0A1A40000000A06ADA484000000060707D1940000000A08DCB484000000000EA721940000000A0E0BA4840000000603EA91840000000609AC0484000000000F1EC17400000008062B948400000000074DA17400000004081BE4840000000C0D4211740000000A07DC34840';
    this.rawWKTLineString = 'LINESTRING';
  });

  describe('.getRawGeometry', function () {
    it('should return the raw value when geometry is created', function () {
      expect(geometry(this.rawWKBPoint).getRawGeometry()).toEqual(this.rawWKBPoint);
      expect(geometry(this.rawWKBPolygon).getRawGeometry()).toEqual(this.rawWKBPolygon);
      expect(geometry(this.rawWKTLineString).getRawGeometry()).toEqual(this.rawWKTLineString);
    });
  });

  describe('.getPostgresType', function () {
    it('should return the type in Postgres format', function () {
      expect(geometry(this.rawWKBPoint).getPostgresType()).toEqual('ST_Point');
      expect(geometry(this.rawWKBPolygon).getPostgresType()).toEqual('ST_MultiPolygon');
      expect(geometry(this.rawWKTLineString).getPostgresType()).toEqual('ST_LineString');
    });
  });

  describe('.getSimpleType', function () {
    it('should return the type in a simpler format', function () {
      expect(geometry(this.rawWKBPoint).getSimpleType()).toEqual('point');
      expect(geometry(this.rawWKBPolygon).getSimpleType()).toEqual('polygon');
      expect(geometry(this.rawWKTLineString).getSimpleType()).toEqual('line');
    });
  });
});
