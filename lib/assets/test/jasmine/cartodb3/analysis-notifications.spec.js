var Backbone = require('backbone');
var Notifier = require('../../../javascripts/cartodb3/components/notifier/notifier');
var AnalysisNotifications = require('../../../javascripts/cartodb3/analysis-notifications');

describe('AnalysisNotifications.track', function () {
  beforeEach(function () {
    this.analysisNode = new Backbone.Model();
    this.notification = new Backbone.Model();
    spyOn(Notifier, 'addNotification').and.returnValue(this.notification);
    spyOn(this.notification, 'set');

    AnalysisNotifications.track(this.analysisNode);
  });

  describe('if there is an existing notification for the node', function () {
    beforeEach(function () {
      spyOn(Notifier, 'getNotification').and.returnValue(this.notification);
    });

    describe('status changes', function () {
      it('should update the notification if analysis is pending', function () {
        this.analysisNode.set('status', 'pending');

        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'loading',
          'info': 'notifications.analysis.pending'
        });
      });

      it('should update the notification if analysis is waiting', function () {
        this.analysisNode.set('status', 'waiting');

        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'loading',
          'info': 'notifications.analysis.waiting'
        });
      });

      it('should update the notification if analysis succeeded', function () {
        this.analysisNode.set('status', 'ready');

        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'success',
          'info': 'notifications.analysis.completed',
          'closable': true,
          'delay': 10000
        });
      });

      it('should update the notification if analysis failed', function () {
        this.analysisNode.set('status', 'failed');

        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'error',
          'info': 'notifications.analysis.failed',
          'closable': true,
          'delay': 10000
        });
      });
    });

    describe('when an analysis node is deleted', function () {
      it('should update the notification', function () {
        this.analysisNode.destroy();
        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'success',
          'info': 'notifications.analysis.removed',
          'closable': true,
          'delay': 10000
        });
      });
    });
  });

  describe('if there is NO notification for the node', function () {
    describe('status changes', function () {
      it('should update the notification if analysis is pending', function () {
        this.analysisNode.set('status', 'pending');

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          status: 'loading',
          info: 'notifications.analysis.pending',
          id: this.analysisNode.cid
        });
      });

      it('should update the notification if analysis is waiting', function () {
        this.analysisNode.set('status', 'waiting');

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          status: 'loading',
          info: 'notifications.analysis.waiting',
          id: this.analysisNode.cid
        });
      });

      it('should update the notification if analysis succeeded', function () {
        this.analysisNode.set('status', 'ready');

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          status: 'success',
          info: 'notifications.analysis.completed',
          closable: true,
          delay: 10000,
          id: this.analysisNode.cid
        });
      });

      it('should update the notification if analysis failed', function () {
        this.analysisNode.set({
          'status': 'failed'
        });

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          status: 'error',
          info: 'notifications.analysis.failed',
          closable: true,
          delay: 10000,
          id: this.analysisNode.cid
        });
      });

      it('should update the notification if analysis failed and has errors', function () {
        this.analysisNode.set({
          'error': { message: 'something went wrong!' },
          'status': 'failed'
        });

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          status: 'error',
          info: 'notifications.analysis.failed: something went wrong!',
          closable: true,
          delay: 10000,
          id: this.analysisNode.cid
        });
      });
    });

    describe('when an analysis node is deleted', function () {
      it('should update the notification', function () {
        this.analysisNode.destroy();

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          status: 'success',
          info: 'notifications.analysis.removed',
          closable: true,
          delay: 10000,
          id: this.analysisNode.cid
        });
      });
    });
  });
});
