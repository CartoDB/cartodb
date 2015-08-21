var VideoTutorialView = require('../../../../../javascripts/cartodb/common/dialogs/video_tutorial/video_tutorial_view');

describe('common/dialogs/video_tutorial', function() {
  beforeEach(function() {
    this.view = new VideoTutorialView();
    this.view.render();
  });  

  it('should render correctly', function() {
    expect(_.size(this.view._subviews)).toBe(3);
    expect(this.view._videoTutorialContent).toBeDefined();
  });

  it('should have a model included', function() {
    expect(this.view.model).toBeDefined();
  });

  describe('header', function() {
    it('should back button when video is selected', function() {
      this.view.model.set('videoId', 'aaa');
      expect(this.view.$('.js-back').length).toBe(1);
    });

    it('should remove videoId from model when back button is clicked', function() {
      this.view.model.set('videoId', 'aaa');
      this.view.$('.js-back').click();
      expect(this.view.model.get('videoId')).toBeUndefined();
    });
  });

  describe('list', function() {
    it('should render items properly', function() {
      expect(this.view.$('.VideoTutorial-item').length).toBe(6);
    });

    it('should trigger template selected when item is clicked', function() {
      var onTemplateSelectedSpy = jasmine.createSpy('onTemplateSelected');
      cdb.god.bind('onTemplateSelected', onTemplateSelectedSpy, this.view);
      this.view.$('.VideoTutorial-itemButton:eq(0)').click();
      expect(onTemplateSelectedSpy).toHaveBeenCalled();
      cdb.god.unbind(null, null, this.view);
    });
  });

  describe('footer', function() {
    it('should be visible only when a video is selected', function() {
      expect(this.view.$('.js-start').length).toBe(0);
      this.view.model.set('videoId', 'aaa');
      expect(this.view.$('.js-start').length).toBe(1);
    });

    it('should trigger an event when button is selected', function() {
      var onStartTutorialSpy = jasmine.createSpy('onStartTutorial');
      cdb.god.bind('startTutorial', onStartTutorialSpy, this.view);
      this.view.model.set('videoId', 'aaa');
      this.view.$('.js-start').click();
      expect(onStartTutorialSpy).toHaveBeenCalled();
      cdb.god.unbind(null, null, this.view);
    });
  });

  it('should show video preview when videoId is set from the beginning', function() {
    expect(this.view._videoTutorialContent.activeTab).toBe('list');
    var view = new VideoTutorialView({ videoId: 'aaa' });
    view.render();
    expect(view._videoTutorialContent.activeTab).toBe('video');
    view.clean();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
