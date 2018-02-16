var Backbone = require('backbone');
var zoomToData = require('builder/editor/map-operations/zoom-to-data');

describe('map-operations/zoom-to-data', function () {
  var bounds = {
    rows: [{
      maxx: 50
    }]
  };
  var responses = {
    success: {
      status: 200,
      responseText: JSON.stringify(bounds)
    },
    error: {
      status: 400
    }
  };
  var configModel = new Backbone.Model({
    user_name: 'curtis',
    sql_api_template: 'api_template',
    api_key: 'TERN4SC0'
  });
  var query = 'SELECT * FROM gringotts';

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.clock().install();
  });

  afterEach(function () {
    jasmine.clock().uninstall();
    jasmine.Ajax.uninstall();
  });

  it('should throw error if parameters not provided', function () {
    expect(function () {
      zoomToData();
    }).toThrowError('configModel is required');

    expect(function () {
      zoomToData({});
    }).toThrowError('stateModel is required');

    expect(function () {
      zoomToData({}, {});
    }).toThrowError('query is required');
  });

  it('should call stateModel.setBounds with the bounds response', function () {
    var result;
    var stateModel = {
      setBounds: function (bounds) {
        result = bounds;
      }
    };

    // Actual call
    zoomToData(configModel, stateModel, query);

    // Respond to call
    var request = jasmine.Ajax.requests.mostRecent();
    request.respondWith(responses.success);
    jasmine.clock().tick(10);

    expect(result[0][1]).toBe(bounds.rows[0].maxx);
  });

  it('should not call again if a request is ongoing', function () {
    var stateModel = {};

    // First call
    zoomToData(configModel, stateModel, query);
    expect(jasmine.Ajax.requests.count()).toBe(1);

    // Second call
    zoomToData(configModel, stateModel, query);
    expect(jasmine.Ajax.requests.count()).toBe(1);
  });
});
