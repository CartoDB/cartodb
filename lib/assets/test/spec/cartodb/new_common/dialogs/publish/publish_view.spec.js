// Mock default behaviour for dependency, re-apply explicitly for tests where we want to test this mixin.
var PublishView = require('../../../../../../javascripts/cartodb/new_common/dialogs/publish/publish_view');

fdescribe('new_common/dialogs/publish/publish_view', function() {
  beforeEach(function() {
    this.vis = new cdb.admin.Visualization({
      id: 'abc-123'
    });
    spyOn(this.vis, 'embedURL').and.returnValue('http://cartodb.com/user/pepe/viz/abc-123/embed_map');
    spyOn(this.vis, 'vizjsonURL').and.returnValue('https://cartodb.com/user/pepe/api/v2/viz/abc-123/viz.json');

    this.view = new PublishView({
      model: this.vis
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

  it('should render the embed option', function() {
    expect(this.innerHTML()).toContain('<iframe width=&quot;100%&quot; height=&quot;520&quot; frameborder=&quot;0&quot; src=&quot;http://cartodb.com/user/pepe/viz/abc-123/embed_map&quot; allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>');
  });

  it('should render the dev cartodb.js option', function() {
    expect(this.innerHTML()).toContain('https://cartodb.com/user/pepe/api/v2/viz/abc-123/viz.json');
  });
});
