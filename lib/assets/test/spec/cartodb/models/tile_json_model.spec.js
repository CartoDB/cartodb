describe('cdb.admin.TileJSON', function() {
  beforeEach(function() {
    this.model = new cdb.admin.TileJSON({
      url: '/tile.json'
    });

    this.attrsExFromToTileJSONSpec = {
      tilejson: '2.1.0',
      name: 'compositing',
      description: 'A simple, light grey world.',
      version: '1.0.0',
      attribution: '<a href="http://openstreetmap.org">OSM contributors</a>',
      template: '{{#__teaser__}}{{NAME}}{{/__teaser__}}',
      legend: 'Dangerous zones are red, safe zones are green',
      scheme: 'xyz',
      tiles: [
        'http://localhost:8888/admin/1.0.0/world-light,broadband/{z}/{x}/{y}.png'
      ],
      grids: [
        'http://localhost:8888/admin/1.0.0/broadband/{z}/{x}/{y}.grid.json'
      ],
      data: [
        'http://localhost:8888/admin/data.geojson'
      ],
      minzoom: 0,
      maxzoom: 11,
      bounds: [ -180, -85.05112877980659, 180, 85.0511287798066 ],
      center: [ -76.275329586789, 39.153492567373, 8 ]
    };
  });

  it('should have a custom URL to get JSON result', function() {
    expect(this.model.url()).toEqual('/tile.json');
  });

  describe('.newTileLayer', function() {
    describe('when have fetched model successfully', function() {
      beforeEach(function() {
        this.model.set(this.attrsExFromToTileJSONSpec);
        this.results = this.model.newTileLayer();
      });

      it('should return a new tile layer', function() {
        expect(this.results).toEqual(jasmine.any(Object));
      });

      it('should return model with expected attrs', function() {
        expect(this.results.get('urlTemplate')).toEqual('http://localhost:8888/admin/1.0.0/world-light,broadband/{z}/{x}/{y}.png');
        expect(this.results.get('maxZoom')).toEqual(11);
        expect(this.results.get('minZoom')).toEqual(0);
        expect(this.results.get('bounding_boxes')).toEqual([ -180, -85.05112877980659, 180, 85.0511287798066 ]);
        expect(this.results.get('attribution')).toEqual('<a href="http://openstreetmap.org">OSM contributors</a>');
        expect(this.results.get('name')).toEqual('compositing');
      });
    });
  });
});
