// Mock default behaviour for dependency, re-apply explicitly for tests where we want to test this mixin.
var PublishView = require('../../../../../../javascripts/cartodb/new_common/dialogs/publish/publish_view');

fdescribe('new_common/dialogs/publish/publish_view', function() {
  beforeEach(function() {
    this.publishOptions = new Backbone.Collection();

    this.view = new PublishView({
      publishOptions: this.publishOptions
    });
    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render fine', function() {
    expect(this.innerHTML()).toContain('Publish your map');
  });

  it('should render the options', function() {
    expect(this.innerHTML()).toContain('OptionCard');
    expect(this.view.$el.find('.OptionCard').length).toEqual(3);
  });
});
