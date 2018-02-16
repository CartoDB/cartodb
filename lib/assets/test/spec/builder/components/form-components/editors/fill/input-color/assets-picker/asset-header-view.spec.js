var Backbone = require('backbone');
var AssetHeaderView = require('builder/components/form-components/editors/fill/input-color/assets-picker/asset-header-view');

describe('components/form-components/editors/fill/input-color/assets-picker/asset-header-view', function () {
  beforeEach(function () {
    this.assetsCollection = new Backbone.Collection([
      { item: 1, state: '' },
      { item: 2, state: '' },
      { item: 3, state: '' }
    ]);

    this.view = new AssetHeaderView({
      title: 'Title',
      editable: true,
      assetsCollection: this.assetsCollection
    });

    this.view.render();
  });

  it('should render', function () {
    expect(this.view.$el.text()).toContain('Title');
  });

  describe('options', function () {
    beforeEach(function () {
      this.assetsCollection.at(0).set('state', 'selected');
      this.assetsCollection.at(1).set('state', 'selected');
    });

    it('should show select all link when some items are selected', function () {
      expect(this.view.$el.find('.js-select-all').length).toBe(1);
    });

    it('should hide select all link when all items are selected', function () {
      this.assetsCollection.at(2).set('state', 'selected');
      expect(this.view.$el.find('.js-select-all').length).toBe(0);
    });

    it('should show deselect all link if all the items are selected', function () {
      this.assetsCollection.at(2).set('state', 'selected');
      expect(this.view.$el.find('.js-deselect-all').length).toBe(1);
    });

    it('should show remove link when an item is selected', function () {
      expect(this.view.$el.find('.js-remove').length).toBe(1);
    });

    it('should hide remove link when no item is selected', function () {
      this.assetsCollection.at(0).set('state', '');
      this.assetsCollection.at(1).set('state', '');
      this.assetsCollection.at(2).set('state', '');
      expect(this.view.$el.find('.js-remove').length).toBe(0);
    });
  });

  describe('triggers', function () {
    beforeEach(function () {
      this.assetsCollection.at(0).set('state', 'selected');
      this.assetsCollection.at(1).set('state', 'selected');
    });

    it('should trigger select-all event', function () {
      var selectAllTrigger;

      this.view.bind('select-all', function () {
        selectAllTrigger = true;
      });

      this.view.$el.find('.js-select-all').click();
      expect(selectAllTrigger).toBeTruthy();
    });

    it('should trigger remove event', function () {
      var removeTrigger;

      this.view.bind('remove', function () {
        removeTrigger = true;
      });

      this.view.$el.find('.js-remove').click();
      expect(removeTrigger).toBeTruthy();
    });

    it('should trigger events for each option', function () {
      var deselectTrigger;

      this.assetsCollection.at(2).set('state', 'selected');

      this.view.bind('deselect-all', function () {
        deselectTrigger = true;
      });

      this.view.$el.find('.js-deselect-all').click();
      expect(deselectTrigger).toBeTruthy();
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
