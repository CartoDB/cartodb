var createDashboard = require('../src/create-dashboard');

describe('create-dashboard', function () {
  describe('given a valid input', function () {
    beforeEach(function () {
      this.$el = document.createElement('div');
      this.$el.id = 'foobar';
      document.body.appendChild(this.$el);
      var selector = '#' + this.$el.id;

      var vizJSON = {
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
      this.results = createDashboard(selector, vizJSON, {});
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
  });
});
