var cdb = require('cartodb.js');
var ModalViewModel = require('../../../../../javascripts/cartodb3/components/modals/modal-view-model');
var ModalView = require('../../../../../javascripts/cartodb3/components/modals/modal-view');

describe('components/modals/modal-view', function () {
  var contentView;

  beforeEach(function () {
    contentView = new cdb.core.View();
    spyOn(contentView, 'render').and.callThrough();
    this.model = new ModalViewModel({
      createContentView: function () { return contentView; }
    });
    this.view = new ModalView({
      model: this.model
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render dialog classes', function () {
    expect(this.view.$el.html()).toContain('Dialog');
    expect(this.view.$el.html()).toContain('Dialog-contentWrapper');
  });
});
