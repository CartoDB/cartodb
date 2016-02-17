var createDashboard = require('../src/create-dashboard');
var cdb = require('cartodb.js');

describe('create-dashboard', function () {
  describe('given a valid input', function () {
    beforeEach(function () {
      this.$el = document.createElement('div');
      this.$el.id = 'foobar';
      document.body.appendChild(this.$el);
      var selector = '#' + this.$el.id;

      this.vizJSON = {
        bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]],
        user: {
        },
        widgets: [{
          type: 'formula',
          title: 'Test coverage',
          order: 0,
          layer_id: 'first-layer',
          options: {
            column: 'coverage_pct',
            operation: 'avg'
          }
        }],
        datasource: {
          maps_api_template: 'http://localhost/spec/',
          user_name: 'pepe'
        },
        layers: [{
          id: 'first-layer',
          type: 'torque' // to be identified as an 'interactive' layer
        }]
      };
      this.results = createDashboard(selector, this.vizJSON, {});
    });

    afterEach(function () {
      document.body.removeChild(this.$el);
    });

    it('should return a dashboard object', function () {
      expect(this.results).toBeDefined();
    });

    it('should expose a dashboard view', function () {
      expect(this.results.dashboardView).toEqual(jasmine.any(Object));
    });

    it('should expose the vis object', function () {
      expect(this.results.vis).toEqual(jasmine.any(Object));
    });

    it('should expose a public API to interact with widgets', function () {
      expect(this.results.widgets).toBeDefined();
      expect(this.results.widgets.get).toBeDefined();
    });

    it('should skip map instantiation', function () {
      spyOn(cdb, 'createVis').and.callThrough();
      createDashboard('#' + this.$el.id, this.vizJSON, {});
      expect(cdb.createVis).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object), jasmine.objectContaining({
        skipMapInstantiation: true
      }));
    });
  });
});
