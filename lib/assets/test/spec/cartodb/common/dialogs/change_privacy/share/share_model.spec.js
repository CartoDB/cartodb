var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var Backbone = require('backbone-cdb-v3');
var ShareModel = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/share_model');

describe('common/dialogs/change_privacy/share/share_model', function() {
  beforeEach(function() {
    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.organization = {
      users: new Backbone.Collection([{
        username: 'paco'
      }, {
        username: 'pito'
      }])
    };

    this.viewModel = new ShareModel({
      vis: this.vis,
      organization: this.organization
    });
  });

  describe('when is a table vis', function() {
    beforeEach(function() {
      this.vis.set('type', 'table');
      spyOn(this.vis.tableMetadata(), 'fetch');
      this.viewModel = new ShareModel({
        vis: this.vis,
        organization: this.organization
      });
    });

    it('should fetch table metadata', function() {
      expect(this.vis.tableMetadata().fetch).toHaveBeenCalled();
    });

    describe('when fetch succeeds', function() {
      beforeEach(function() {
        this.allCallback = jasmine.createSpy('all');
        this.viewModel.bind('all', this.allCallback);
        this.vis.tableMetadata().fetch.calls.argsFor(0)[0].success();
      });

      it('should trigger an all event', function() {
        expect(this.allCallback).toHaveBeenCalled();
      });
    });
  });

  describe('.isWriteAccessTogglerAvailable', function() {
    it('should return true if vis is a table', function() {
      expect(this.viewModel.isWriteAccessTogglerAvailable()).toBeFalsy();

      spyOn(this.vis, 'isVisualization').and.returnValue(false);
      expect(this.viewModel.isWriteAccessTogglerAvailable()).toBeTruthy();
    });
  });
});
