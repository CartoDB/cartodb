var CreateVisFirstView = require('../../../../../../javascripts/cartodb/common/dialogs/create_vis_first/create_vis_first_view');

describe('common/dialogs/create_vis_first/create_vis_first_view', function() {
  beforeEach(function() {
    this.successCallback = jasmine.createSpy('success callback');
    this.vis = new cdb.admin.Visualization({
      name: 'my_table',
      type: 'table'
    });
    this.router = new cdb.admin.TableRouter();

    spyOn(this.vis, 'changeToVisualization');
    spyOn(this.router, 'changeToVis');

    this.view = new CreateVisFirstView({
      model: this.vis,
      router: this.router,
      title: 'This test expects an title',
      explanation: 'This test expects an explanation',
      success: this.successCallback
    });
    this.view.render();
  });

  it('should render the confirm view first', function() {
    expect(this.innerHTML()).toContain('ok');
  });

  it('should render the title and explanation', function() {
    expect(this.innerHTML()).toContain('This test expects an title');
    expect(this.innerHTML()).toContain('This test expects an explanation');
  });

  describe('when confirm/ok to create map first', function() {
    beforeEach(function() {
      this.view.$el.find('.ok').click();
    });

    it('should change to the loading view', function() {
      expect(this.innerHTML()).not.toContain('This test expects');
      expect(this.innerHTML()).toContain('Creating map');
    });

    it('should call the change-to-visualization on the model', function() {
      expect(this.vis.changeToVisualization).toHaveBeenCalled();
      expect(this.vis.changeToVisualization).toHaveBeenCalledWith(jasmine.objectContaining({
        success: jasmine.any(Function),
        error: jasmine.any(Function)
      }));
    });

    describe('when successfully changed', function() {
      beforeEach(function() {
        spyOn(this.view, 'clean');
        this.vis.changeToVisualization.calls.argsFor(0)[0].success(this.vis);
      });

      it('should tell router to change to map', function() {
        expect(this.router.changeToVis).toHaveBeenCalled();
        expect(this.router.changeToVis).toHaveBeenCalledWith(this.vis);
      });

      it('should call the given success callback', function() {
        expect(this.successCallback).toHaveBeenCalled();
      });

      it('should clean this view', function() {
        expect(this.view.clean).toHaveBeenCalled();
      });
    });

    describe('when fails to create map', function() {
      beforeEach(function() {
        this.vis.changeToVisualization.calls.argsFor(0)[0].error();
      });

      it('should show the fail view', function() {
        expect(this.innerHTML()).toContain('Could not create map');
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
