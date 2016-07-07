alert('hey');
var Backbone = require('backbone');
var Notifier = require('../../../javascripts/cartodb3/components/notifier/notifier');
var AnalysisNotifications = require('../../../javascripts/cartodb3/analysis-notifications');
var AnalysisDefinitionNodesCollection = require('../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

fdescribe('analysis-notifications', function () {
  beforeEach(function () {
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection();
    new AnalysisNotifications({ // eslint-disable-line
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection
    });
    this.notification = new Backbone.Model();
  });

  it('should display a notification when an analysis node is added', function () {
    spyOn(Notifier, 'addNotification').and.returnValue(this.notification);

    this.analysisDefinitionNode = this.analysisDefinitionNodesCollection.add({
      id: 'x1',
      type: 'buffer',
      params: {
        radius: 100,
        source: {
          id: 'a1'
        }
      }
    });

    expect(Notifier.addNotification).toHaveBeenCalledWith('wadus');
  });

  describe('status changes', function () {
    describe('if there is a notification for the analyis', function () {
      beforeEach(function () {
        this.analysisDefinitionNode = this.analysisDefinitionNodesCollection.add({
          id: 'x1',
          type: 'buffer',
          params: {
            radius: 100,
            source: {
              id: 'a1'
            }
          }
        });
      });

      it('should update the notification if analysis succeeded', function () {

      });

      it('should update the notification if analysis failed', function () {

      });
    });

    describe('if there is NO notification for the analysis', function () {
      it('should add a new notification if analysis succeeded', function () {

      });

      it('should add a new notification if analysis failed', function () {

      });
    });
  });

  describe('when an analysis node is deleted', function () {
    describe('if there is a notification for the analyis', function () {
      it('should update the notification if analysis succeeded', function () {

      });
    });

    describe('if there is NO notification for the analysis', function () {
      it('should add a new notification', function () {

      });
    });
  });
});
