var cdb = require('cartodb.js');
var _ = require('underscore');
var Backbone = require('backbone');
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

  describe('.usersUsingVis', function() {
    describe('when no other created a vis on top of it', function() {
      it('should return an empty list', function() {
        expect(this.viewModel.usersUsingVis()).toEqual([]);
      });
    });

    describe('when there are at least one user that used datasets', function() {
      beforeEach(function() {
        this.owner = {};
        var stub = jasmine.createSpy('cdb.admin.Visualization');
        stub.permission = stub;
        stub.permission.owner = this.owner;

        this.metadata = jasmine.createSpyObj('table metadata', ['get']);
        spyOn(this.vis, 'tableMetadata').and.returnValue(this.metadata);
        this.metadata.get.and.returnValue([ stub ]);
      });

      it('should return them as a list', function() {
        expect(this.viewModel.usersUsingVis()).toEqual([ this.owner ]);
      });
    });
  });

  describe('.canChangeWriteAccess', function() {
    it('should return true if vis is a table', function() {
      expect(this.viewModel.canChangeWriteAccess()).toBeFalsy();

      spyOn(this.vis, 'isVisualization').and.returnValue(false);
      expect(this.viewModel.canChangeWriteAccess()).toBeTruthy();
    });
  });

  describe('.organizationUsers', function() {
    beforeEach(function() {
      this.organization = {
        users: new Backbone.Collection([{
          username: 'jose'
        }, {
          username: 'joseManuel'
        }, {
          username: 'luis'
        }])
      };

      this.viewModel.set('organization', this.organization);
    });

    describe('when no search is present', function() {
      it('should return all users in the organization', function() {
        var userNames = _.map(this.viewModel.organizationUsers(), function(user){return user.get('username')});

        expect(userNames).toEqual(["jose", "joseManuel", "luis"]);
      });
    });

    describe('when search is present', function() {

      it('should return users whose username starts with the search', function() {
        this.viewModel.set('search', 'jose')
        var userNames = _.map(this.viewModel.organizationUsers(), function(user){return user.get('username')});

        expect(userNames).toEqual(["jose", "joseManuel"]);
      });

      it('should ignore whitespaces when filtering', function() {
        this.viewModel.set('search', ' jose ')
        var userNames = _.map(this.viewModel.organizationUsers(), function(user){return user.get('username')});

        expect(userNames).toEqual(["jose", "joseManuel"]);
      });

      it('should be case insensitive', function() {
        this.viewModel.set('search', 'joseManuel')
        var userNames = _.map(this.viewModel.organizationUsers(), function(user){return user.get('username')});

        expect(userNames).toEqual(["joseManuel"]);
      });
    });
  });
});
