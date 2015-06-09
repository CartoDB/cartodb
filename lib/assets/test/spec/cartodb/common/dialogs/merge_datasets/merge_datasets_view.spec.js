var $ = require('jquery');
var MergeDatasetsView = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/merge_datasets_view');

describe('common/dialog/merge_datasets/merge_datasets_view', function() {
  beforeEach(function() {
    this.table = TestUtil.createTable('test');

    this.view = new MergeDatasetsView({
      table: this.table
    });
    this.view.render();
  });

  it('should display start view', function() {
    expect(this.innerHTML()).toContain('js-flavors');
    expect(this.innerHTML()).not.toContain('js-details');
  });

  describe('when merge type (column) is clicked', function() {
    beforeEach(function() {
      $(this.view.$('.OptionCard')[0]).click();
    });

    it('should render the next view', function() {
      expect(this.innerHTML()).not.toContain('js-flavors');
      expect(this.innerHTML()).toContain('js-details');
    });

    describe('when click back', function() {
      beforeEach(function() {
        this.view.$('.js-back').click();
      });

      it('should display start view again', function() {
        expect(this.innerHTML()).toContain('js-flavors');
        expect(this.innerHTML()).not.toContain('js-details');
      });
    });
  });

  describe('when click spatial merge type', function() {
    beforeEach(function() {
      $(this.view.$('.OptionCard')[1]).click();
    });

    it('should render the next view', function() {
      expect(this.innerHTML()).not.toContain('js-flavors');
      expect(this.innerHTML()).toContain('js-details');
    });
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });
});
