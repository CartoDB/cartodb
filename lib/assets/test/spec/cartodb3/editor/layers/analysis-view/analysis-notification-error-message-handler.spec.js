var cdb = require('cartodb.js');
var AnalysisNotificationErrorMessageHandler = require('../../../../../../javascripts/cartodb3/analysis-notification-error-message-handler');

describe('AnalysisNotificationErrorMessageHandler.extractErrorMessage', function () {
  it('should extract the right error message', function () {
    var analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'b1',
      error: {
        message: 'cdb_dataservices_client._cdb_route_point_to_point(7): [cartodb_user_a6f0d0fe-4f4f-4217-8150-22b0010fe409_db] REMOTE ERROR: spiexceptions.InternalError: plpy.Error: There was an error trying to obtain route using mapzen provider: Timeout reading from socket'
      }
    });
    expect(AnalysisNotificationErrorMessageHandler.extractErrorMessage(analysisDefinitionNodeModel)).toEqual('notifications.analysis.failed: There was an error trying to obtain route using mapzen provider: Timeout reading from socket');

    analysisDefinitionNodeModel.set('error', { message: 'There was an error' });
    expect(AnalysisNotificationErrorMessageHandler.extractErrorMessage(analysisDefinitionNodeModel)).toEqual('notifications.analysis.failed: There was an error');

    analysisDefinitionNodeModel.set('error', { message: 'OMG, weird Exception: There was an error' });
    expect(AnalysisNotificationErrorMessageHandler.extractErrorMessage(analysisDefinitionNodeModel)).toEqual('notifications.analysis.failed: There was an error');
  });
});
