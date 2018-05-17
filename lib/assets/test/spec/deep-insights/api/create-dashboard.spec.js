var Backbone = require('backbone');
var _ = require('underscore');
var createDashboard = require('../../../../javascripts/deep-insights/api/create-dashboard');
var APIDashboard = require('../../../../javascripts/deep-insights/api/dashboard');
var cdb = require('internal-carto.js');

var newVisMock = function () {
  var visMock = new Backbone.Model();
  visMock.map = {
    layers: {
      get: function () { return new Backbone.Model(); }
    }
  };
  visMock.dataviews = jasmine.createSpyObj('dataviews', ['createFormulaModel']);
  visMock.dataviews.createFormulaModel.and.returnValue(new Backbone.Model());
  visMock.analysis = jasmine.createSpyObj('analysis', ['findNodeById']);
  visMock.analysis.findNodeById.and.returnValue(new Backbone.Model());
  visMock.done = function (callback) { callback(); };
  visMock.error = function (callback) { callback(); };
  visMock.instantiateMap = jasmine.createSpy('instantiateMap');
  visMock.invalidateSize = jasmine.createSpy('invalidateSize');

  return visMock;
};

describe('api/create-dashboard', function () {
  pending('Fix the cdb.core.Model issue');
  describe('given a valid input', function () {
    beforeEach(function () {
      this.$el = document.createElement('div');
      this.$el.id = 'foobar';
      this.selectorId = '#' + this.$el.id;
      document.body.appendChild(this.$el);

      this.vizJSON = {
        title: 'testing',
        bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]],
        zoom: 4,
        center: '[50.56375157034741, 42.5390625]',
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
          },
          source: {
            id: 'a0'
          }
        }],
        datasource: {
          maps_api_template: 'https://{user}.cartodb.com',
          user_name: 'documentation'
        },
        layers: [{
          id: 'first-layer',
          type: 'torque', // to be identified as an 'interactive' layer
          visible: true
        }]
      };

      this.visMock = newVisMock();
      // Stubbing cdb.createVis to return a mock of a vis object cause is was
      // impossible to make tests pass in CI when using the real cdb.createVis
      spyOn(cdb, 'createVis').and.returnValue(this.visMock);
    });

    afterEach(function () {
      document.body.removeChild(this.$el);
    });

    it('should return an API dashboard object', function () {
      var callback = jasmine.createSpy('callback');

      createDashboard(this.selectorId, this.vizJSON, {}, callback);

      // visjson is loaded into the vis and map instantiation succeeded
      this.visMock.trigger('load', this.visMock);
      this.visMock.instantiateMap.calls.argsFor(0)[0].success();

      expect(callback).toHaveBeenCalled();
      var error = callback.calls.argsFor(0)[0];
      var dashboard = callback.calls.argsFor(0)[1];

      expect(error).toBe(null);
      expect(dashboard instanceof APIDashboard).toBeTruthy();
      expect(dashboard._dashboard.areWidgetsInitialised).toBeDefined();
    });

    it('should return an API dashboard object and error if there was an error', function () {
      var callback = jasmine.createSpy('callback');

      createDashboard(this.selectorId, this.vizJSON, {}, callback);

      // visjson is loaded into the vis and map instantiation failed
      this.visMock.trigger('load', this.visMock);
      this.visMock.instantiateMap.calls.argsFor(0)[0].error();

      expect(callback).toHaveBeenCalled();
      var error = callback.calls.argsFor(0)[0];
      var dashboard = callback.calls.argsFor(0)[1];

      expect(error).not.toBe(null);
      expect(dashboard instanceof APIDashboard).toBeTruthy();
      expect(dashboard._dashboard.areWidgetsInitialised).toBeDefined();
    });

    it('should skip map instantiation and explictely isntantiate the map after everything has been loaded', function () {
      var callback = jasmine.createSpy('callback');

      createDashboard(this.selectorId, this.vizJSON, {}, callback);

      expect(this.visMock.instantiateMap).not.toHaveBeenCalled();

      // visjson is loaded into the vis
      this.visMock.trigger('load', this.visMock);

      expect(this.visMock.instantiateMap).toHaveBeenCalled();
    });

    describe('areWidgetsInitialised', function () {
      beforeEach(function () {
        var callback = jasmine.createSpy('callback');
        createDashboard(this.selectorId, this.vizJSON, {}, callback);
        this.visMock.trigger('load', this.visMock);
        this.visMock.instantiateMap.calls.argsFor(0)[0].success();
        this.dashboard = callback.calls.argsFor(0)[1];

        this.widgetsCollection = this.dashboard._dashboard.widgets._widgetsCollection;
        spyOn(this.widgetsCollection, 'hasInitialState');
        spyOn(this.widgetsCollection, 'size');
      });

      describe('if there are widgets', function () {
        beforeEach(function () {
          this.widgetsCollection.size.and.returnValue(2);
        });

        it('should return false when widgets don\'t have initial state', function () {
          this.widgetsCollection.hasInitialState.and.returnValue(false);
          expect(this.dashboard._dashboard.areWidgetsInitialised()).toBeFalsy();
        });

        it('should return true when widgets have initial state', function () {
          this.widgetsCollection.hasInitialState.and.returnValue(true);
          expect(this.dashboard._dashboard.areWidgetsInitialised()).toBeTruthy();
        });
      });

      describe('if there is no widgets', function () {
        beforeEach(function () {
          this.widgetsCollection.size.and.returnValue(0);
        });

        it('should return true when there are no widgets', function () {
          expect(this.dashboard._dashboard.areWidgetsInitialised()).toBeTruthy();
        });
      });
    });

    describe('state change', function () {
      beforeEach(function () {
        spyOn(_, 'debounce').and.callFake(function (func) {
          return function () {
            func.apply(this, arguments);
          };
        });
      });

      it('should bind state changes if share_urls is true', function () {
        spyOn(APIDashboard.prototype, 'onStateChanged').and.callThrough();
        var callback = jasmine.createSpy('callback');
        createDashboard(this.selectorId, this.vizJSON, { share_urls: true }, callback);
        this.visMock.trigger('load', this.visMock);
        this.visMock.instantiateMap.calls.argsFor(0)[0].success();
        expect(APIDashboard.prototype.onStateChanged).toHaveBeenCalled();
      });
    });
  });
});
