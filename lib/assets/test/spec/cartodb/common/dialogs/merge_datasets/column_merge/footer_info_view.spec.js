var cdb = require('cartodb.js-v3');
var FooterInfoView = require('../../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/column_merge/footer_info_view');
var ChooseKeyColumnsModel = require('../../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/column_merge/choose_key_columns_model');

describe('common/dialog/merge_datasets/column_merge/footer_info_view', function() {
  describe('when given a model with no pre-selected key columns', function() {
    beforeEach(function() {
      this.model = new ChooseKeyColumnsModel({
        leftTable: TestUtil.createTable('foobar', [['LEFT', 'string']])
      });
      this.model.get('rightColumns').add({ name: 'RIGHT' });
      this.view = new FooterInfoView({
        model: this.model
      });
      this.view.render();
    });

    it('should not have leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });

    describe('when change left columns', function() {
      beforeEach(function() {
        this.model.get('leftColumns').first().set('selected', true);
      });

      it('should render the left name', function() {
        expect(this.innerHTML()).toContain('LEFT');
      });

      it('should contain the placeholder for right column', function() {
        expect(this.innerHTML()).toContain('is-placeholder');
      });

      describe('when selected a right column', function() {
        beforeEach(function() {
          this.model.get('rightColumns').first().set('selected', true);
        });

        it('should render the right name', function() {
          expect(this.innerHTML()).toContain('RIGHT');
        });

        it('should contain the placeholder for right column', function() {
          expect(this.innerHTML()).not.toContain('is-placeholder');
        });
      });
    });
  });

  describe('when given a model with left/right columns from the start', function() {
    beforeEach(function() {
      this.model = new cdb.core.Model({
        leftKeyColumn: new cdb.core.Model({ name: 'LEFT' }),
        rightKeyColumn: new cdb.core.Model({ name: 'RIGHT' })
      });

      spyOn(this.model, 'bind');

      this.view = new FooterInfoView({
        model: this.model
      });
      this.view.render();
    });

    it('should not have leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });

    it('should renders the names of the given key columns', function() {
      expect(this.innerHTML()).toContain('LEFT');
      expect(this.innerHTML()).toContain('RIGHT');
    });

    it('should not require any listeners by default', function() {
      expect(this.model.bind).not.toHaveBeenCalled();
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
