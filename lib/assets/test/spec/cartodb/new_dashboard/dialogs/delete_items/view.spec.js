var DeleteItems = require('new_dashboard/dialogs/delete_items/view');
var Router = require('new_dashboard/router');

describe('new_dashboard/dialogs/delete_items/view', function() {
  beforeEach(function() {
    this.collection = new cdb.admin.Visualizations();

    this.router = new Router({
      rootUrl: ''
    });
    this.router.model.set('content_type', 'datasets');

    this.view = new DeleteItems({
      collection: this.collection,
      router:     this.router
    });

    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('given at least one selected item', function() {
    beforeEach(function() {
      this.collection.reset([
        { selected: true },
        { selected: false },
        { selected: true }
      ]);
      this.view.render();
      this.html = this.view.el.innerHTML;
    });

    it('should render a text with amount of items to be deleted', function() {
      expect(this.html).toContain('delete 2 datasets');
      expect(this.html).toContain('them'); // the object pronoun of the sentence
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
