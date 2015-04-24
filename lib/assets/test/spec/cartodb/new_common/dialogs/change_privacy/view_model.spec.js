var ChangePrivacyViewModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/change_privacy/view_model');
var cdb = require('cartodb.js');
var $ = require('jquery');

describe('new_common/dialogs/change_privacy_view_model', function() {
  beforeEach(function() {
    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    // Org user
    this.user = new cdb.admin.User({
      username: 'pepe',
      actions: {
      },
      organization: {
        users: [
          {
            username: 'paco'
          },
          {
            username: 'pito'
          }
        ]
      }
    });

    this.createNormalUser = function() {
      this.user = new cdb.admin.User({
        username: 'pepe',
        actions: {
        }
      });
    };

    this.createViewModel = function() {
      this.viewModel = new ChangePrivacyViewModel({
        vis: this.vis,
        user: this.user
      });
    };
    this.createViewModel();
  });

  it('should have a privacy options', function() {
    expect(this.viewModel.get('privacyOptions')).toEqual(jasmine.any(Object));
  });

  describe('.changeState', function() {
    it('should have Start as start state', function() {
      expect(this.viewModel.get('state')).toEqual('Start');
    });

    describe('when called multiple times', function() {
      beforeEach(function() {
        this.viewModel.bind('change:state', function() {
          this.changedState = true;
        }, this);

        this.viewModel.changeState('Start');
      });

      it('should trigger a change:state event', function() {
        expect(this.changedState).toBeTruthy();
      });
    });
  });

  describe('.canShare', function() {
    describe('when the user is a normal user', function() {
      beforeEach(function() {
        this.createNormalUser();
        this.createViewModel();
      });

      it('should return false', function() {
        expect(this.viewModel.canShare()).toBeFalsy();
      });
    });

    describe('when the user is part of organization', function() {
      it('should return true', function() {
        expect(this.viewModel.canShare()).toBeTruthy();
      });
    });
  });

  describe('.usersUsingVis', function() {
    beforeEach(function() {
      this.createNormalUser();
      this.createViewModel();
    });

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

  describe('.shouldShowShareBanner', function() {
    describe('when user is a normal user', function() {
      beforeEach(function() {
        this.createNormalUser();
        this.createViewModel();
      });

      it('should return false', function() {
        expect(this.viewModel.shouldShowShareBanner()).toBeFalsy();
      });
    });

    describe('when user is part of organization', function() {
      it('should return true', function() {
        expect(this.viewModel.shouldShowShareBanner()).toBeTruthy();
      });
    });
  });

  describe('.shouldRenderDialogWithExpandedLayout', function() {
    it('should return true if state is share', function() {
      expect(this.viewModel.shouldRenderDialogWithExpandedLayout()).toBeFalsy();

      this.viewModel.set('state', 'Share');
      expect(this.viewModel.shouldRenderDialogWithExpandedLayout()).toBeTruthy();
    });
  });

  describe('.canChangeWriteAccess', function() {
    it('should return true if vis is a table', function() {
      expect(this.viewModel.canChangeWriteAccess()).toBeFalsy();

      spyOn(this.vis, 'isVisualization').and.returnValue(false);
      expect(this.viewModel.canChangeWriteAccess()).toBeTruthy();
    });
  });

  describe('.canSave', function() {
    it('should return true if selected option allows it', function() {
      expect(this.viewModel.canSave()).toBeTruthy();

      spyOn(this.viewModel.get('privacyOptions').selectedOption(), 'canSave').and.returnValue(false);
      expect(this.viewModel.canSave()).toBeFalsy();
    });
  });

  describe('.save', function() {
    describe('when can save', function() {
      beforeEach(function() {
        this.deferred = $.Deferred();
        this.selected = this.viewModel.get('privacyOptions').selectedOption();
        spyOn(this.selected, 'saveToVis').and.returnValue(this.deferred.promise());
        this.viewModel.save();
      });

      it('should change state to Saving', function() {
        expect(this.viewModel.get('state')).toEqual('Saving');
      });

      it('should call .saveToVis on selected option', function() {
        expect(this.selected.saveToVis).toHaveBeenCalled();
        expect(this.selected.saveToVis).toHaveBeenCalledWith(this.viewModel.get('vis'));
      });

      describe('when save fails', function() {
        beforeEach(function() {
          this.deferred.reject();
        });

        it('should change to save fail state', function() {
          expect(this.viewModel.get('state')).toEqual('SaveFail');
        });
      });

      describe('when save resolves', function() {
        describe('when permissions also have changed', function() {
          beforeEach(function() {
            this.viewModel.get('permission').acl.reset([{}]);

            this.orgPermission = this.viewModel.get('vis').permission;
            spyOn(this.orgPermission, 'overwriteAcl');

            this.secDeferred = $.Deferred();
            spyOn(this.orgPermission, 'save').and.returnValue(this.secDeferred);

            this.deferred.resolve();
          });

          it('should save permission', function() {
            expect(this.orgPermission.overwriteAcl).toHaveBeenCalled();
            expect(this.orgPermission.overwriteAcl).toHaveBeenCalledWith(this.viewModel.get('permission'));
            expect(this.orgPermission.save).toHaveBeenCalled();
          });

          describe('when 2nd save resolves', function() {
            beforeEach(function() {
              this.secDeferred.resolve();
            });

            it('should change state to SaveDone', function() {
              expect(this.viewModel.get('state')).toEqual('SaveDone');
            });
          });

          describe('when 2nd save fails', function() {
            beforeEach(function() {
              this.secDeferred.reject();
            });

            it('should change state to SaveDone', function() {
              expect(this.viewModel.get('state')).toEqual('SaveFail');
            });
          });
        });

        describe('when permissions have not been changed', function() {
          beforeEach(function() {
            this.deferred.resolve();
          });

          it('should change to save done state', function() {
            expect(this.viewModel.get('state')).toEqual('SaveDone');
          });
        });
      });
    });
  });
});
