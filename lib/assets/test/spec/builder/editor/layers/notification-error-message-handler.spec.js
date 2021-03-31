var cdb = require('internal-carto.js');
var NotificationErrorHandler = require('builder/editor/layers/notification-error-message-handler');

describe('NotificationErrorHandler.extractErrorFromAnalysisNode', function () {
  it('should extract the right error message', function () {
    var analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'b1',
      error: {
        message: 'cdb_dataservices_client._cdb_route_point_to_point(7): [cartodb_user_a6f0d0fe-4f4f-4217-8150-22b0010fe409_db] REMOTE ERROR: spiexceptions.InternalError: plpy.Error: There was an error trying to obtain route using mapzen provider: Timeout reading from socket'
      }
    });

    var errorMessage = NotificationErrorHandler.extractErrorFromAnalysisNode(analysisDefinitionNodeModel);
    expect(errorMessage.message).toEqual('notifications.analysis.failed: There was an error trying to obtain route using mapzen provider: Timeout reading from socket');

    analysisDefinitionNodeModel.set('error', { message: 'There was an error' });
    errorMessage = NotificationErrorHandler.extractErrorFromAnalysisNode(analysisDefinitionNodeModel);
    expect(errorMessage.message).toEqual('notifications.analysis.failed: There was an error');

    analysisDefinitionNodeModel.set('error', { message: 'OMG, weird Exception: There was an error' });
    errorMessage = NotificationErrorHandler.extractErrorFromAnalysisNode(analysisDefinitionNodeModel);
    expect(errorMessage.message).toEqual('notifications.analysis.failed: There was an error');
  });

  it('should replace the message with a more meaningful one', function () {
    var analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'b1',
      error: {
        message: 'RuntimeError: Execution of function interrupted by signal'
      }
    });
    var errorMessage = NotificationErrorHandler.extractErrorFromAnalysisNode(analysisDefinitionNodeModel);
    expect(errorMessage.message).toEqual('notifications.analysis.failed: notifications.analysis.errors.timeout');
  });

  it('should return the same error if there isn\'t a replacement', function () {
    var analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'b1',
      error: {
        message: 'I am an unsupported error message. Hi!'
      }
    });

    var errorMessage = NotificationErrorHandler.extractErrorFromAnalysisNode(analysisDefinitionNodeModel);
    expect(errorMessage.message).toEqual('notifications.analysis.failed: I am an unsupported error message. Hi!');
  });

  it('should return the standard error if the analysis does not contain an error message', function () {
    var analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'b1'
    });
    var errorMessage = NotificationErrorHandler.extractErrorFromAnalysisNode(analysisDefinitionNodeModel);
    expect(errorMessage.message).toEqual('notifications.analysis.failed');
  });

  it('should extract the error from a string', function () {
    var errorMessage = NotificationErrorHandler.extractError('this_is_a_test_1: Postgis Plugin: ERROR: column "the_geom_webmercator" does not exist LINE 1: ...ECT ST_AsTWKB(ST_Simplify(ST_RemoveRepeatedPoints("the_geom_... ^ in executeQuery Full sql was: \'SELECT ST_AsTWKB(ST_Simplify(ST_RemoveRepeatedPoints("the_geom_webmercator",1e-05),1e-05,true),5) AS geom FROM (SELECT 1 FROM this_is_a_test_1) as cdbq WHERE "the_geom_webmercator" && ST_MakeEnvelope(-20037508.3,20037508.25881302,-20037508.25881302,20037508.3,3857)\'');
    expect(errorMessage.type).toEqual('warning');
    expect(errorMessage.message).toEqual('notifications.analysis.errors.without-geom-webmercator');
  });
});
