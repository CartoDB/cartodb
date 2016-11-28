var Backbone = require('backbone');
var zoomToData = require('../../../../../javascripts/cartodb3/editor/map-operations/zoom-to-data');
var Notifier = require('../../../../../javascripts/cartodb3/components/notifier/notifier');

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

  function removeExistingNotifications () {
    Notifier.getCollection().set([]);
  }

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.clock().install();
    removeExistingNotifications();
  });

  afterEach(function () {
    removeExistingNotifications();
    jasmine.clock().uninstall();
    jasmine.Ajax.uninstall();
  });

  function assertNotification (notification, status, text, closable) {
    expect(notification.attributes.status).toEqual(status);
    expect(notification.attributes.info).toEqual(text);
    expect(notification.attributes.closable).toBe(closable);
  }

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

  it('should show notifications and call stateModel.setBounds with the bounds response', function () {
    var result;
    var notification;
    var stateModel = {
      setBounds: function (bounds) {
        result = bounds;
      }
    };

    // Actual call
    zoomToData(configModel, stateModel, query);

    // Notification shown while loading
    expect(Notifier.getCollection().models[0]).not.toBe(null);
    notification = Notifier.getCollection().models[0];
    assertNotification(notification, 'loading', 'editor.layers.notifier.center-map.loading', false);

    // Respond to call
    var request = jasmine.Ajax.requests.mostRecent();
    request.respondWith(responses.success);
    jasmine.clock().tick(10);

    expect(result[0][1]).toBe(bounds.rows[0].maxx);
    assertNotification(notification, 'success', 'editor.layers.notifier.center-map.success', true);
  });

  it('should show error notifications if call fails', function () {
    var stateModel = {};
    var notification;

    // Actual call
    zoomToData(configModel, stateModel, query);

    notification = Notifier.getCollection().models[0];

    // Respond to call with error
    jasmine.Ajax.requests.mostRecent().respondWith(responses.error);
    jasmine.clock().tick(10);

    assertNotification(notification, 'error', 'editor.layers.notifier.center-map.error', true);
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
