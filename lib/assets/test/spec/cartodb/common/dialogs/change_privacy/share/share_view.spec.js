var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var ShareView = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/share_view');
var ChangePrivacyView = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/change_privacy_view');

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The importat feature is the interactions and that view don't throw errors on render and updates.
 */
describe('common/dialogs/change_privacy/share/share_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'pepe',
      actions: {},
      organization: {
        users: [
          {
            id: 'abc-123',
            username: 'paco'
          },
          {
            id: 'abc-456',
            username: 'pepe'
          }
        ],
        id: 'hello-org-id'
      }
    });

    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    spyOn(ChangePrivacyView.prototype, 'appendToBody');

    this.view = new ShareView({
      vis: this.vis,
      user: this.user,
      ChangePrivacyView: ChangePrivacyView
    });
    spyOn(this.view, 'close');
    this.viewModel = this.view.model;
    spyOn(this.view, 'killEvent');

    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the header', function() {
    expect(this.innerHTML()).toContain('Select');
  });

  describe('when click OK', function() {
    beforeEach(function() {
      jasmine.clock().install(); // due to modal animations
      var self = this;
      this.deferred = $.Deferred();
      spyOn(this.vis.permission, 'overwriteAcl').and.callThrough();
      spyOn(this.vis.permission, 'save').and.callFake(function() {
        return self.deferred;
      });
      this.view.$('.ok').click();
      jasmine.clock().tick(1000);
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('should render sharing...', function() {
      expect($('.Dialog').text()).toContain('Sharing');
    });

    it('should overwrite existing ACL', function() {
      expect(this.vis.permission.overwriteAcl).toHaveBeenCalled();
      expect(this.vis.permission.overwriteAcl).toHaveBeenCalledWith(this.viewModel.get('permission'));
    });

    it('should save original permission', function() {
      expect(this.vis.permission.save).toHaveBeenCalled();
    });

    describe('when save succeeds', function() {
      beforeEach(function() {
        this.deferred.resolve();
        jasmine.clock().tick(1000);
      });

      it('should open the privacy dialog', function() {
        expect(ChangePrivacyView.prototype.appendToBody).toHaveBeenCalled();
      });

      it('should close this dialog', function() {
        expect(this.view.close).toHaveBeenCalled();
      });

      it('should not show loading anymore', function() {
        expect($('.Dialog').text()).not.toContain('Sharing');
      });
    });

    describe('when save fails', function() {
      beforeEach(function() {
        this.deferred.reject();
        jasmine.clock().tick(1000);
      });

      it('should show error', function() {
        expect($('.Dialog').text()).not.toContain('Sharing');
        expect($('.Dialog').text()).toContain('error');
      });
    });
  });

  describe('when click back', function() {
    beforeEach(function() {
      this.view.$('.js-back').click();
    });

    it('should open privacy dialog again', function() {
      expect(ChangePrivacyView.prototype.appendToBody).toHaveBeenCalled();
    });

    it('should close this dialog', function() {
      expect(this.view.close).toHaveBeenCalled();
    });
  });

  afterEach(function() {
    this.view.clean();
  })
});
