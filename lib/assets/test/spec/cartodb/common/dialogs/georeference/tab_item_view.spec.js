var cdb = require('cartodb.js-v3');
var TabItemView = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/tab_item_view');

describe('common/dialog/georeference/tab_item_view', function() {
  beforeEach(function() {
    this.model = new cdb.core.Model({
    });
    this.model.TAB_LABEL = 'my-tab';
    this.view = new TabItemView({
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should be rendered with defaults', function() {
    expect(this.innerHTML()).toContain('my-tab');
    expect(this.innerHTML()).not.toContain('disabled');
    expect(this.innerHTML()).not.toContain('selected');
  });

  describe('when selected', function() {
    beforeEach(function() {
      this.model.set('selected', true);
    });

    it('should change visual accordingly', function() {
      expect(this.innerHTML()).toContain('selected');
    });
  });

  describe('when disabled is set', function() {
    beforeEach(function() {
      this.model.set('disabled', 'some reason');
      this.view.render();
    });

    it('should disable the tab', function() {
      expect(this.innerHTML()).toContain('disabled');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
