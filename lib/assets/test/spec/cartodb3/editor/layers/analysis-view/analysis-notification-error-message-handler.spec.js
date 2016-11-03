var cdb = require('cartodb.js');
var AnalysisNotificationErrorMessageHandler = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/analysis-notification-error-message-handler');

describe('AnalysisNotificationErrorMessageHandler.extractErrorMessage', function () {
  it('should extract the right error message', function () {
    var analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'b1',
      error: {
        message: 'cdb_dataservices_client._cdb_route_point_to_point(7): [cartodb_user_a6f0d0fe-4f4f-4217-8150-22b0010fe409_db] REMOTE ERROR: spiexceptions.InternalError: plpy.Error: There was an error trying to obtain route using mapzen provider: Timeout reading from socket'
      }
    });
    expect(AnalysisNotificationErrorMessageHandler.extractErrorMessage(analysisDefinitionNodeModel)).toEqual('notifications.analysis.failed: There was an error trying to obtain route using mapzen provider: Timeout reading from socket');

    analysisDefinitionNodeModel.set('error', { message: 'InternalError: cdb_dataservices_server._obs_getmeasure(7): [obs_2016_10_14_65e534f91e] REMOTE ERROR: Error performing intersection: TopologyException: found non-noded intersection between LINESTRING (-96.5796 32.577, -96.579 32.5768) and LINESTRING (-96.579 32.5768, -96.579 32.5768) at -96.578972198741511 32.576761407730309' });

    expect(AnalysisNotificationErrorMessageHandler.extractErrorMessage(analysisDefinitionNodeModel)).toEqual('notifications.analysis.failed: found non-noded intersection between LINESTRING (-96.5796 32.577, -96.579 32.5768) and LINESTRING (-96.579 32.5768, -96.579 32.5768) at -96.578972198741511 32.576761407730309');

    analysisDefinitionNodeModel.set('error', { message: 'There was an error' });
    expect(AnalysisNotificationErrorMessageHandler.extractErrorMessage(analysisDefinitionNodeModel)).toEqual('notifications.analysis.failed: There was an error');

    analysisDefinitionNodeModel.set('error', { message: 'OMG, weird Exception: There was an error' });
    expect(AnalysisNotificationErrorMessageHandler.extractErrorMessage(analysisDefinitionNodeModel)).toEqual('notifications.analysis.failed: There was an error');
  });

  it('should replace the message with a more meaningful one', function () {
    var analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'b1',
      error: {
        message: 'RuntimeError: Execution of function interrupted by signal'
      }
    });
    expect(AnalysisNotificationErrorMessageHandler.extractErrorMessage(analysisDefinitionNodeModel)).toEqual('notifications.analysis.failed: notifications.analysis.errors.timeout');
  });

  it('should return the same error if there isn\'t a replacement', function () {
    var analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'b1',
      error: {
        message: 'I am an unsupported error message. Hi!'
      }
    });
    expect(AnalysisNotificationErrorMessageHandler.extractErrorMessage(analysisDefinitionNodeModel)).toEqual('notifications.analysis.failed: I am an unsupported error message. Hi!');
  });

  it('should return the standard error if the analysis does not contain an error message', function () {
    var analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'b1'
    });
    expect(AnalysisNotificationErrorMessageHandler.extractErrorMessage(analysisDefinitionNodeModel)).toEqual('notifications.analysis.failed');
  });
});
