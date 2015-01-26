var ChangePrivacyDialog = require('new_dashboard/dialogs/change_privacy_view');
var cdbAdmin = require('cdb.admin');

/**
 * Most high-fidelity details are covered in underlying tabpane views, see separate tests.
 */
describe('new_dashboard/dialogs/change_privacy_view', function() {
  beforeEach(function() {

    this.vis = new cdbAdmin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });
    
    this.user = new cdbAdmin.User({
      username: 'pepe',
      actions: {
      }
    });

    this.upgradeUrl  ='/account/upgrade';

    this.setupView = function() {
      this.view = new ChangePrivacyDialog({
        vis: this.vis,
        user: this.user,
        upgradeUrl: this.upgradeUrl
      });
      this.view.render(); 
      $(document.body).append(this.view.$el);
    }
  });


  describe('given a normal user', function() {
    beforeEach(function() {
      this.user = new cdbAdmin.User({
        username: 'pepe',
        actions: {}
      });

      this.setupView();
    });

    it('should have no leaks', function() {
      expect(this.view).toHaveNoLeaks();
    }); 
  });

  describe('given a organization user', function() {
    beforeEach(function() {
      this.user = new cdbAdmin.User({
        username: 'pepe',
        actions: {},
        organization: {
          users: [
            {
              username: 'kålle'
            },
            {
              username: 'ada'
            }
          ]
        }
      }); 
      
      this.setupView();
    });
  
    it('should rendered the start view by default', function() {
      expect(this.view._contentPane.getPane('start_view').$el.is(':visible')).toBeTruthy();
      expect(this.view._contentPane.getPane('share_view').$el.is(':hidden')).toBeTruthy();
    });
  
    describe('given a click:share event is triggered on start view', function() {
      beforeEach(function() {
        this.setupView();
        this.view._contentPane.getPane('start_view').trigger('click:share');
      });
  
      it('should render the share tab', function() {
        expect(this.view._contentPane.getPane('start_view').$el.is(':hidden')).toBeTruthy();
        expect(this.view._contentPane.getPane('share_view').$el.is(':visible')).toBeTruthy();
      });
  
      describe('and then a click:back event is fired on share tab', function() {
        beforeEach(function() {
          this.view._contentPane.getPane('share_view').trigger('click:back');
        });
  
        it('should render the share tab', function() {
          expect(this.view._contentPane.getPane('start_view').$el.is(':visible')).toBeTruthy();
          expect(this.view._contentPane.getPane('share_view').$el.is(':hidden')).toBeTruthy();
        });
      });
    });

    it('should have no leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('on pane click:save event', function() {
    beforeEach(function() {
      this.setupView();
      spyOn(this.view, 'close');

      this.selected = this.view._privacyOptions.find(function(option) { return option.get('selected'); });
      spyOn(this.selected, 'saveToVis');
      this.deferred = $.Deferred();
      this.selected.saveToVis.and.returnValue(this.deferred.promise());

      this.view._contentPane.getActivePane().trigger('click:save');
    });

    it('should save selected privacy to visualization', function() {
      expect(this.selected.saveToVis).toHaveBeenCalled();
      expect(this.selected.saveToVis).toHaveBeenCalledWith(this.vis);
    });

    describe('given save finishes successfully', function() {
      beforeEach(function() {
        this.deferred.resolve();
      });

      it('should close the dialog', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });

    describe('given save fails', function() {
      beforeEach(function() {
        this.deferred.reject('fail');
      });
    });
  });


  afterEach(function() {
    this.view.clean();
  });
});

