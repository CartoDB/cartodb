var cdb = require('cartodb.js-v3');
var ChangePrivacyDialog = require('../../../../../../javascripts/cartodb/common/dialogs/change_privacy/change_privacy_view');
var ShareView = require('../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/share_view');

/**
 * Most high-fidelity details are covered in underlying tabpane views, see separate tests.
 */
describe('dashboard/dialogs/change_privacy/change_privacy_view', function() {
  beforeEach(function() {

    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.user = new cdb.admin.User({
      username: 'pepe',
      actions: {},
      organization: {
        users: [
          {
            username: 'paco'
          },
          {
            username: 'pito'
          }
        ],
        id: 'hello-org-id'
      }
    });

    this.setupView = function() {
      this.view && this.view.clean();
      this.view = new ChangePrivacyDialog({
        vis: this.vis,
        user: this.user
      });
      this.view.render();
    };
  });

  describe('when can not share vis', function() {
    beforeEach(function() {
      this.user.organization = undefined;
      this.setupView();
    });

    it('should not have any share view', function() {
      expect(this.innerHTML()).not.toContain('js-share');
    });

    it('should have no leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when can share vis', function() {
    beforeEach(function() {
      this.setupView();
    });

    it('should show share link', function() {
      expect(this.innerHTML()).toContain('js-share');
    });

    describe('when click share', function() {
      beforeEach(function() {
        spyOn(this.view, 'close');
        var self = this;
        spyOn(ShareView.prototype, 'appendToBody').and.callFake(function() {
          self.shareView = this;
        });
        this.view.$('.js-share').click();
      });

      it('should opened the share view', function() {
        expect(ShareView.prototype.appendToBody).toHaveBeenCalled();
      });

      it('should close this view', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });

    it('should have no leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when click/enter to OK', function() {
    beforeEach(function() {
      this.setupView();
      this.selectedOption = this.view._privacyOptions.selectedOption();
      spyOn(this.selectedOption, 'saveToVis');
      this.view.$('.ok').click();
    });

    it('should save privacy', function() {
      expect(this.selectedOption.saveToVis).toHaveBeenCalled();
      expect(this.selectedOption.saveToVis.calls.argsFor(0)[0]).toEqual(this.vis);
    });

    it('should render saving view', function() {
      expect(this.innerHTML()).toContain('Saving privacy…');
    });

    describe('when save succeeds', function() {
      beforeEach(function() {
        spyOn(this.view, 'close');
        this.selectedOption.saveToVis.calls.argsFor(0)[1].success();
      });

      it('should close view', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });

    describe('when save fails', function() {
      beforeEach(function() {
        this.selectedOption.saveToVis.calls.argsFor(0)[1].error();
      });

      it('should show error', function() {
        expect(this.innerHTML()).toContain('error');
      });
    });
  });

  afterEach(function() {
    if (this.view) {
      this.view.clean();
    }
  });
});
