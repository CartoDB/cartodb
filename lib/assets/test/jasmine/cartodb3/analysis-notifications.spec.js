var Backbone = require('backbone');
var Notifier = require('../../../javascripts/cartodb3/components/notifier/notifier');
var ConfigModel = require('../../../javascripts/cartodb3/data/config-model');
var AnalysisNotifications = require('../../../javascripts/cartodb3/analysis-notifications');
var AnalysisDefinitionNodesCollection = require('../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('analysis-notifications', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });

    new AnalysisNotifications({ // eslint-disable-line
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection
    });
    this.notification = new Backbone.Model();

    spyOn(Notifier, 'addNotification').and.returnValue(this.notification);
  });

  it('should display a notification when an analysis node is added', function () {
    this.analysisDefinitionNode = this.analysisDefinitionNodesCollection.add({
      id: 'x1',
      type: 'buffer',
      params: {
        radius: 100,
        source: {
          id: 'a1',
          type: 'source',
          params: {
            query: 'SELECT foo FROM bar'
          }
        }
      }
    });

    expect(Notifier.addNotification).toHaveBeenCalledWith({
      'status': 'loading',
      'info': 'notifications.analysis.started',
      'closable': false
    });
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
              id: 'a1',
              type: 'source',
              params: {
                query: 'SELECT foo FROM bar'
              }
            }
          }
        });

        expect(Notifier.addNotification).toHaveBeenCalled();
        spyOn(this.notification, 'set');
      });

      it('should update the notification if analysis succeeded', function () {
        this.analysisDefinitionNode.set('status', 'ready');

        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'success',
          'info': 'notifications.analysis.completed',
          'closable': true,
          'delay': 10000
        });
      });

      it('should update the notification if analysis failed', function () {
        this.analysisDefinitionNode.set('status', 'failed');

        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'error',
          'info': 'notifications.analysis.failed',
          'closable': true,
          'delay': 10000
        });
      });
    });

    describe('if there is NO notification for the analysis', function () {
      beforeEach(function () {
        this.analysisDefinitionNode = this.analysisDefinitionNodesCollection.add({
          id: 'x1',
          type: 'buffer',
          params: {
            radius: 100,
            source: {
              id: 'a1',
              type: 'source',
              params: {
                query: 'SELECT foo FROM bar'
              }
            }
          }
        }, { silent: true });
      });

      it('should add a new notification if analysis succeeded', function () {
        expect(Notifier.addNotification).not.toHaveBeenCalled();

        this.analysisDefinitionNode.set('status', 'ready');

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          'status': 'success',
          'info': 'notifications.analysis.completed',
          'closable': true,
          'delay': 10000
        });
      });

      it('should add a new notification if analysis failed', function () {
        expect(Notifier.addNotification).not.toHaveBeenCalled();

        this.analysisDefinitionNode.set('status', 'failed');

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          'status': 'error',
          'info': 'notifications.analysis.failed',
          'closable': true,
          'delay': 10000
        });
      });
    });
  });

  describe('when an analysis node is deleted', function () {
    describe('if there is a notification for the analyis', function () {
      beforeEach(function () {
        this.analysisDefinitionNode = this.analysisDefinitionNodesCollection.add({
          id: 'x1',
          type: 'buffer',
          params: {
            radius: 100,
            source: {
              id: 'a1',
              type: 'source',
              params: {
                query: 'SELECT foo FROM bar'
              }
            }
          }
        });

        expect(Notifier.addNotification).toHaveBeenCalled();
        spyOn(this.notification, 'set');
      });

      it('should update the notification', function () {
        this.analysisDefinitionNodesCollection.remove(this.analysisDefinitionNode);
        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'success',
          'info': 'notifications.analysis.removed',
          'closable': true,
          'delay': 10000
        });
      });
    });

    describe('if there is NO notification for the analysis', function () {
      beforeEach(function () {
        this.analysisDefinitionNode = this.analysisDefinitionNodesCollection.add({
          id: 'x1',
          type: 'buffer',
          params: {
            radius: 100,
            source: {
              id: 'a1',
              type: 'source',
              params: {
                query: 'SELECT foo FROM bar'
              }
            }
          }
        }, { silent: true });

        expect(Notifier.addNotification).not.toHaveBeenCalled();
      });

      it('should add a new notification', function () {
        this.analysisDefinitionNodesCollection.remove(this.analysisDefinitionNode);

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          'status': 'success',
          'info': 'notifications.analysis.removed',
          'closable': true,
          'delay': 10000
        });
      });
    });
  });
});
