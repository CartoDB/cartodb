var _ = require('underscore');
var Backbone = require('backbone');
var Notifier = require('builder/components/notifier/notifier');
var AnalysisNotifications = require('builder/editor/layers/analysis-views/analysis-notifications');

describe('AnalysisNotifications.track', function () {
  beforeEach(function () {
    this.analysisNode = new Backbone.Model({ id: 'a1' });
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
          'info': 'notifications.analysis.waiting'
        });
      });

      it('should update the notification if analysis is running', function () {
        this.analysisNode.set('status', 'running');

        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'loading',
          'info': 'notifications.analysis.running'
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
          'delay': Notifier.DEFAULT_DELAY
        });
      });

      it('should update the notification if analysis failed', function () {
        this.analysisNode.set('status', 'failed');

        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'error',
          'info': 'notifications.analysis.failed',
          'closable': true,
          'autoclosable': false
        });
      });
    });

    describe('when an analysis node is deleted', function () {
      it('should update the notification', function () {
        this.analysisNode.trigger('destroy', this.analysisNode);
        expect(this.notification.set).toHaveBeenCalledWith({
          'status': 'success',
          'info': 'notifications.analysis.removed',
          'closable': true,
          'delay': Notifier.DEFAULT_DELAY
        });
      });

      it('should not update the notification if avoidNotification', function () {
        this.analysisNode.set({avoidNotification: true}, {silent: true});
        this.analysisNode.trigger('destroy', this.analysisNode);
        expect(this.notification.set).not.toHaveBeenCalled();
      });
    });
  });

  describe('if there is NO notification for the node', function () {
    _.each(['pending', 'waiting', 'failed'], function (status) {
      it('should display a notification if node has a ' + status + ' status initially', function () {
        this.analysisNode = new Backbone.Model({ id: 'a1' });
        this.analysisNode.set({
          status: status
        });

        AnalysisNotifications.track(this.analysisNode);

        expect(Notifier.addNotification).toHaveBeenCalled();
      });
    });

    it('should NOT display a notification if node has a ready status initially', function () {
      this.analysisNode = new Backbone.Model({ id: 'a1' });
      this.analysisNode.set({
        status: 'ready'
      });

      AnalysisNotifications.track(this.analysisNode);

      expect(Notifier.addNotification).not.toHaveBeenCalled();
    });

    describe('status changes', function () {
      it('should update the notification if analysis is pending', function () {
        this.analysisNode.set('status', 'pending');

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          status: 'loading',
          info: 'notifications.analysis.waiting',
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
          delay: Notifier.DEFAULT_DELAY,
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
          autoclosable: false,
          id: this.analysisNode.cid
        });
      });

      describe('when an analysis node has errors', function () {
        it('should update the notification if analysis failed and has errors', function () {
          this.analysisNode.set({
            'error': { message: 'something went wrong!' },
            'status': 'failed'
          });

          expect(Notifier.addNotification).toHaveBeenCalledWith({
            status: 'error',
            info: 'notifications.analysis.failed: something went wrong!',
            closable: true,
            autoclosable: false,
            id: this.analysisNode.cid
          });
        });

        it('should update the notification if analysis failed and has errors in error_message', function () {
          this.analysisNode.set({
            'error_message': 'something went a little bit wrong!',
            'status': 'failed'
          });

          expect(Notifier.addNotification).toHaveBeenCalledWith({
            status: 'error',
            info: 'notifications.analysis.failed: something went a little bit wrong!',
            closable: true,
            autoclosable: false,
            id: this.analysisNode.cid
          });
        });
      });
    });

    describe('when an analysis node is deleted', function () {
      it('should update the notification', function () {
        this.analysisNode.trigger('destroy', this.analysisNode);

        expect(Notifier.addNotification).toHaveBeenCalledWith({
          status: 'success',
          info: 'notifications.analysis.removed',
          closable: true,
          delay: Notifier.DEFAULT_DELAY,
          id: this.analysisNode.cid
        });
      });
    });
  });
});
