var _ = require('underscore');
var Backbone = require('backbone');
var InputRampListView = require('builder/components/form-components/editors/fill/input-color/input-quantitative-ramps/input-ramp-list-view');
var rampList = require('cartocolor');

describe('components/form-components/editors/fill/input-color/input-quantitative-ramps/input-ramp-list-view', function () {
  describe('with a default ramp', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        bins: 7,
        range: ['#f6d2a9', '#f5b78e', '#f19c7c', '#ea8171', '#dd686c', '#ca5268', '#b13f64'],
        attribute: 'column1',
        quantification: 'jenks'
      });

      this.view = new InputRampListView(({
        model: this.model
      }));

      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('.js-listItem').length).toBe(_.toArray(rampList).length);
      expect(this.view.$('.js-customList').text()).toContain('form-components.editors.fill.customize');
    });

    it('should select ramp on click', function () {
      this.view.$('.js-listItem:eq(2) .js-listItemLink').click();
      var selectedRamp = _.toArray(rampList)[2];
      var ramp = selectedRamp[7];
      var tags = selectedRamp.tags;
      expect(tags).toContain('quantitative');
      expect(this.model.get('range').join(',').toLowerCase()).toBe('#f6d2a9,#f5b78e,#f19c7c,#ea8171,#dd686c,#ca5268,#b13f64');
      expect(this.view.$('.js-listItem:eq(2)').data('val')).toContain(ramp.join(','));
      expect(this.view.$('.js-listItem.is-selected').length).toBe(1);
    });

    it('should invert the ramp', function () {
      expect(this.view.collection.at(2).get('val').join(',').toLowerCase()).toBe('#f6d2a9,#f5b78e,#f19c7c,#ea8171,#dd686c,#ca5268,#b13f64');
      this.view.$('.js-listItem:eq(2) .js-listItemLink').click();
      this.view.$('.js-listItem:eq(2) .js-invert').click();

      var firstRamp = _.toArray(rampList)[1];
      var selectedRamp = _.toArray(rampList)[2];
      var thirdRamp = _.toArray(rampList)[3];

      var ramp = selectedRamp[7];
      var tags = selectedRamp.tags;

      expect(tags).toContain('quantitative');
      expect(this.model.get('range').join(',').toLowerCase()).toBe('#b13f64,#ca5268,#dd686c,#ea8171,#f19c7c,#f5b78e,#f6d2a9');
      expect(this.view.collection.at(2).get('val').join(',').toLowerCase()).toBe('#b13f64,#ca5268,#dd686c,#ea8171,#f19c7c,#f5b78e,#f6d2a9');
      expect(this.view.$('.js-listItem:eq(1)').data('val')).toContain(firstRamp[7].join(','));
      expect(this.view.$('.js-listItem:eq(2)').data('val')).toContain(ramp.reverse().join(','));
      expect(this.view.$('.js-listItem:eq(3)').data('val')).toContain(thirdRamp[7].join(','));
      expect(this.view.$('.js-listItem.is-selected').length).toBe(1);
      expect(this.view.$('.js-listItem.is-inverted').length).toBe(1);
    });

    it('should update ramps on attribute type changes and select the first one', function () {
      spyOn(this.view, 'render').and.callThrough();

      this.model.set('attribute_type', 'string');

      expect(this.view.render).toHaveBeenCalled();
      expect(this.view.$('.js-listItem:eq(0)').data('val')).toContain(this.view.collection.at(0).get('val').join(','));
      expect(this.view.$('.js-listItem:eq(0)').hasClass('is-selected')).toBe(true);
      expect(this.view.$('.js-customize').text()).toBe('form-components.editors.fill.customize');
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    afterEach(function () {
      this.view.remove();
    });
  });

  describe('with a custom ramp', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        bins: 3,
        range: ['#FABADA', '#FADFAD', '#BADBAD'],
        attribute: 'column1',
        quantification: 'jenks'
      });

      this.view = new InputRampListView(({
        model: this.model
      }));

      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('.js-customRamp').hasClass('is-selected')).toBeTruthy();
      expect(this.view.$('.js-customRamp .ColorBar:eq(0)').css('background-color')).toBe('rgb(250, 186, 218)');
      expect(this.view.$('.js-customRamp .ColorBar:eq(1)').css('background-color')).toBe('rgb(250, 223, 173)');
      expect(this.view.$('.js-customRamp .ColorBar:eq(2)').css('background-color')).toBe('rgb(186, 219, 173)');
    });

    it('should select the custom ramp', function () {
      this.view.$('.js-listItemLink:eq(0)').click();
      this.view.$('.js-customRamp').click();
      expect(this.view.$('.js-customRamp').hasClass('is-selected')).toBeTruthy();
    });

    it('should start the customization process clicking on the customized ramp again', function () {
      var customizeEventTriggered = false;

      this.view.$('.js-listItemLink:eq(0)').click();
      this.view.$('.js-customRamp').click();

      this.view.bind('customize', function () {
        customizeEventTriggered = true;
      }, this);

      this.view.$('.js-customRamp').click();
      expect(customizeEventTriggered).toBeTruthy();
    });

    it('should clear the custom ramp', function () {
      expect(this.view.$('.js-customRamp .ColorBar').length).toBe(3);
      this.view.$('.js-clear').click();
      expect(this.view.$('.js-customRamp .ColorBar').length).toBe(0);
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
