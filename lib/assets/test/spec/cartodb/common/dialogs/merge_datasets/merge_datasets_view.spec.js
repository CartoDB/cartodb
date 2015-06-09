var $ = require('jquery');
var _ = require('underscore');
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

  describe('when column merge is clicked', function() {
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

    it('should render columns of actual table', function() {
      expect(this.innerHTML()).toContain('test');
      expect(this.innerHTML()).toContain('test2');
    });

    it('should not render the_geom column', function() {
      expect(this.innerHTML()).not.toContain('the_geom');
    });

    it('should have next button disabled', function() {
      expect(this.view.$('.js-next').hasClass('is-disabled')).toBeTruthy();
    });

    describe('when a table is selected', function() {
      beforeEach(function() {
        // Called by the table selector view
        this.tableData = {};
        spyOn(this.view.model.get('currentStep'), 'fetchMergeColumns');
        _.values(this.view._subviews)[0]._onChangeTableData(undefined, this.tableData);
      });

      it('should call to fetch corresponding merge columns', function() {
        expect(this.view.model.get('currentStep').fetchMergeColumns).toHaveBeenCalled();
      });

      describe('when merge columns are fetched', function() {
        beforeEach(function() {
          var currentStep = this.view.model.get('currentStep');
          currentStep.get('mergeColumns').reset([
            ['merge-column-1', 'string'],
            ['merge-column-2', 'number']
          ]);
        });

        it('should render the merge columns', function() {
          expect(this.innerHTML()).toContain('merge-column');
        });

        it('should not render the_geom column for merge columns either', function() {
          expect(this.innerHTML()).not.toContain('the_geom');
        });

        describe('when selected a column from both lists', function() {
          beforeEach(function() {
            $(this.view.$('.js-actual-columns .RadioButton')[1]).click();
            $(this.view.$('.js-merge-columns .RadioButton')[1]).click();
          });

          it('should enable next button', function() {
            expect(this.view.$('.js-next').hasClass('is-disabled')).toBeFalsy();
          });
        });
      });
    });
  });

  describe('when spatial merge is clicked', function() {
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
