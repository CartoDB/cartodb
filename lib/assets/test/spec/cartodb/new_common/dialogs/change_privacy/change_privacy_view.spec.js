var cdbAdmin = require('cdb.admin');
var $ = require('jquery');
var ChangePrivacyDialog = require('../../../../../../javascripts/cartodb/new_common/dialogs/change_privacy/change_privacy_view');
var ViewModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/change_privacy/view_model');

/**
 * Most high-fidelity details are covered in underlying tabpane views, see separate tests.
 */
describe('new_dashboard/dialogs/change_privacy/change_privacy_view', function() {
  beforeEach(function() {

    this.vis = new cdbAdmin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.user = new cdbAdmin.User({
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
        ]
      }
    });

    this.viewModel = new ViewModel({
      vis: this.vis,
      user: this.user
    });

    spyOn(this.viewModel, 'shouldRenderDialogWithExpandedLayout');

    this.setupView = function() {
      this.view = new ChangePrivacyDialog({
        viewModel: this.viewModel
      });
      this.view.render();
      $(document.body).append(this.view.$el);
    };
  });

  describe('when can not share vis', function() {
    beforeEach(function() {
      spyOn(this.viewModel, 'canShare').and.returnValue(false);
      this.setupView();
    });

    it('should not have any share view', function() {
      expect(this.view._shareView).toBeUndefined();
    });

    it('should have no leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when can share vis', function() {
    beforeEach(function() {
      spyOn(this.viewModel, 'canShare').and.returnValue(true);
      this.setupView();
    });

    it('should have a share view', function() {
      expect(this.view._shareView).not.toBeUndefined();
    });

    it('should rendered the start view to start with', function() {
      expect(this.innerHTML()).toContain('privacy');
    });

    describe('when change state to share', function() {
      beforeEach(function() {
        this.viewModel.changeState('Share');
      });

      it('should have rendered share view', function() {
        expect(this.innerHTML()).toContain('Select your ');
      });

      describe('when clicking back button', function() {
        beforeEach(function() {
          spyOn(this.viewModel, 'changeState').and.callThrough();
          this.view.$('.js-back').click();
        });

        it('should change state to Share', function() {
          expect(this.viewModel.changeState).toHaveBeenCalled();
          expect(this.viewModel.changeState).toHaveBeenCalledWith('Start');
        });
      });
    });

    it('should have no leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when change state changes to SaveDone', function() {
    beforeEach(function() {
      this.setupView();
      spyOn(this.view, 'close');
      this.viewModel.changeState('SaveDone');
    });

    it('should close the view', function() {
      expect(this.view.close).toHaveBeenCalled();
    });
  });

  describe('when change state changes to Saving', function() {
    beforeEach(function() {
      this.setupView();
      this.viewModel.changeState('Saving');
    });

    it('should render saving view', function() {
      expect(this.innerHTML()).toContain('Saving privacy...');
    });
  });

  describe('when change state changes to SaveFail ', function() {
    beforeEach(function() {
      this.setupView();
      this.viewModel.changeState('SaveFail');
    });

    it('should render error view', function() {
      expect(this.innerHTML()).toContain('error');
    });
  });

  afterEach(function() {
    if (this.view) {
      this.view.clean();
    }
  });
});
