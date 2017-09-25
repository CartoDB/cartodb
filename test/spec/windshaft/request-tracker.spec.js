var RequestTracker = require('../../../src/windshaft/request-tracker');
var Request = require('../../../src/windshaft/request');

describe('windshaft/request-tracker', function () {
  var MAX_NUMBER_OF_REQUESTS = 3;
  var requestTracker;
  var requestMock = new Request('payloadMock', 'paramsMock');

  beforeEach(function () {
    requestTracker = new RequestTracker(MAX_NUMBER_OF_REQUESTS);
  });

  describe('.canRequestBePerformed', function () {
    it('should allow "MAX_NUMBER_OF_REQUESTS" equal requests when the response is the same', function () {
      expect(requestTracker.canRequestBePerformed(requestMock)).toEqual(true);
      requestTracker.track(requestMock, 'responseMock');
      expect(requestTracker.canRequestBePerformed(requestMock)).toEqual(true);
      requestTracker.track(requestMock, 'responseMock');
      expect(requestTracker.canRequestBePerformed(requestMock)).toEqual(true);
      requestTracker.track(requestMock, 'responseMock');
      expect(requestTracker.canRequestBePerformed(requestMock)).toEqual(false);
    });

    it('should allow more than "MAX_NUMBER_OF_REQUESTS" equal requests when the response is different', function () {
      // Reach the request limit (3)
      requestTracker.track(requestMock, 'responseMock');
      requestTracker.track(requestMock, 'responseMock1');
      requestTracker.track(requestMock, 'responseMock2');
      expect(requestTracker.canRequestBePerformed(requestMock)).toEqual(true);
    });

    it('should allow more than "MAX_NUMBER_OF_REQUESTS" when the requests are different ', function () {
      // Reach the request limit (3)
      requestTracker.track(requestMock, 'responseMock');
      requestTracker.track(requestMock, 'responseMock');
      requestTracker.track(requestMock, 'responseMock');
      // Perform a different request
      var requestMock1 = new Request('payloadMock1', 'paramsMock1');
      expect(requestTracker.canRequestBePerformed(requestMock1)).toEqual(true);
    });
  });
});
