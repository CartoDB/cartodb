var createDashboard = require('../../src/api/create-dashboard');
var APIDashboard = require('../../src/api/dashboard');
var cdb = require('cartodb.js');

describe('create-dashboard', function () {
  describe('given a valid input', function () {
    beforeEach(function () {
      this.$el = document.createElement('div');
      this.$el.id = 'foobar';
      document.body.appendChild(this.$el);

      this.vizJSON = {
        bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]],
        zoom: 4,
        center: "[50.56375157034741, 42.5390625]",
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
    });

    afterEach(function () {
      document.body.removeChild(this.$el);
    });

    it('should return an API dashboard object', function (done) {
      var selector = '#' + this.$el.id;
      createDashboard(selector, this.vizJSON, {}, function (error, dashboard) {
        if (error) return;
        expect(dashboard).toBeDefined();
        expect(dashboard instanceof APIDashboard).toBeTruthy();
        done();
      });
    });

    it('should skip map instantiation', function () {
      spyOn(cdb, 'createVis').and.callThrough();
      createDashboard('#' + this.$el.id, this.vizJSON, {}, function (error, dashboard) {
        if (error) return;
      });
      expect(cdb.createVis).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object), jasmine.objectContaining({
        skipMapInstantiation: true
      }));
    });
  });
});
