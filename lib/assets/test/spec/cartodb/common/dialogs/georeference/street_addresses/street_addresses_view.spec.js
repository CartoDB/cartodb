var cdb = require('cartodb.js');
var StreetAddressesModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/street_addresses/street_addresses_model');
var GeocodeStuff = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff');
var ViewFactory = require('../../../../../../../javascripts/cartodb/common/view_factory');
var UserGeocoding = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/user_geocoding_model');

describe('common/dialog/georeference/street_addresses/street_addresses_view', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuff('table_id');
    this.model = new StreetAddressesModel({
      geocodeStuff: this.geocodeStuff,
      isGoogleMapsUser: false,
      userGeocoding: new UserGeocoding(),
      estimation: new cdb.admin.Geocodings.Estimation(),
      columns: [
        ['string', 'foo'],
        ['number', 'lon'],
        ['boolean', 'bar'],
        ['number', 'lat']
      ]
    });
    this.view = this.model.createView();
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when rows changes', function() {
    describe('when no rows have any value', function() {
      it('should set formatter to an empty string or undefined', function() {
        expect(this.model.get('formatter')).toBeFalsy();
      });

      it('should not be able to continue just yet', function() {
        expect(this.model.get('canContinue')).toBe(false);
      });
    });

    describe('when at least one row has an value', function() {
      beforeEach(function() {
        this.model.get('rows').first().set('columnOrFreeTextValue', 'col');
      });

      it('should set formatter to to the value', function() {
        expect(this.model.get('formatter')).toEqual('{col}');
      });

      it('should be able to continue', function() {
        expect(this.model.get('canContinue')).toBe(true);
      });

      describe('when a row has a free text value', function() {
        beforeEach(function() {
          this.model.get('rows').last().set({
            columnOrFreeTextValue: ' foo bar   ',
            isFreeText: true
          });
        });

        it('should set formatter as a comma separated list with the free text value trimmed', function() {
          expect(this.model.get('formatter')).toEqual('{col}, foo bar');
        });

        it('should still be able to continue', function() {
          expect(this.model.get('canContinue')).toBe(true);
        });
      });
    });
  });

  describe('when add-another-row button is clicked', function() {
    beforeEach(function() {
      this.view.$el.appendTo(document.body); // to be able to assert :Visible
      this.view.$('.js-add-row').click();
    });

    it('should add another street row', function() {
      expect(this.innerHTML()).toContain('Additional information to complete street address');
    });

    it('should render one add-more button only', function() {
      expect(this.view.$('.js-add-row:hidden').length).toEqual(1);
      expect(this.view.$('.js-add-row:visible').length).toEqual(1);
    });

    it('should hide add-more after 2nd click (since only allow 2)', function() {
      this.view.$('.js-add-row:visible').click();
      expect(this.view.$('.js-add-row:visible').length).toEqual(0);
      expect(this.view.$('.js-add-row:hidden').length).toEqual(3);
    });
  });

  describe('when estimation is changed', function() {
    beforeEach(function() {
      this.triggerAnyEvent = function() {
        this.model.get('estimation').trigger('all');
      };
    });

    it('should not have to agree to terms-of-service if there is no cost for georeference task', function() {
      // google map users don't get charged
      this.model.set('isGoogleMapsUser', true);
      this.triggerAnyEvent();
      expect(this.model.get('mustAgreeToTOS')).toBe(false);

      // If have hard limit set (i.e. no soft limit) the user will never be charged for more, so neither
      this.model.set('isGoogleMapsUser', false);
      this.model.get('userGeocoding').set('hard_limit', true);
      this.triggerAnyEvent();
      expect(this.model.get('mustAgreeToTOS')).toBe(false);

      // If estimated cost is 0 then no need to confirm either
      this.model.set('isGoogleMapsUser', false);
      this.model.get('userGeocoding').set('hard_limit', false);
      this.model.get('estimation').set('estimation', 0);
      expect(this.model.get('mustAgreeToTOS')).toBe(false);
    });

    it('should have to agree to terms-of-service if there might be a charge', function() {
      // there is an estimated price
      this.model.get('estimation').set('estimation', 123);
      expect(this.model.get('mustAgreeToTOS')).toBe(true);

      // there is no known estimated price
      this.model.get('estimation').set('estimation', undefined);
      expect(this.model.get('mustAgreeToTOS')).toBe(true);

      this.model.get('estimation').set('estimation', undefined);
      expect(this.model.get('mustAgreeToTOS')).toBe(true);
    });

    describe('when estimation is not known and hard limit is false', function() {
      beforeEach(function() {
        this.model.get('userGeocoding').set('hard_limit', false);
        this.model.get('estimation').set('estimation', undefined);
      });

      it('should require user to agree to terms-of-service', function() {
        expect(this.model.get('hasAgreedToTOS')).toBe(false);
      });
    });
  });

  describe('when confirm TOS is changed', function() {
    beforeEach(function() {
      var orgCcreateDialogByTemplate = ViewFactory.createDialogByTemplate;
      var self = this;
      spyOn(ViewFactory, 'createDialogByTemplate').and.callFake(function() {
        var view = orgCcreateDialogByTemplate.apply(ViewFactory, arguments);
        self.dlg = view;
        return view;
      });
      spyOn(this.view, 'addView');
    });

    describe('when set to false', function() {
      beforeEach(function() {
        this.model.set('confirmTOS', false);
        this.model.trigger('change:confirmTOS');
      });

      it('should do nothing', function() {
        expect(ViewFactory.createDialogByTemplate).not.toHaveBeenCalled();
        expect(this.view.addView).not.toHaveBeenCalled();
      });
    });

    describe('when set to true', function() {
      beforeEach(function() {
        this.model.set('confirmTOS', true);
      });

      it('should have created a child view', function() {
        expect(ViewFactory.createDialogByTemplate).toHaveBeenCalled();
      });

      it('should not close the prev modal when opening the confirmation one', function() {
        expect(this.dlg.options.triggerDialogEvents).toBe(false);
      });

      it('should clean up modal when the other one is closed', function() {
        expect(this.dlg.options.clean_on_hide).toBe(false);
        expect(this.view.addView).toHaveBeenCalledWith(this.dlg);
      });

      describe('when user agree to TOS', function() {
        beforeEach(function() {
          expect(this.model.get('hasAgreedToTOS')).toBe(false);
          spyOn(this.model, 'continue');
          this.dlg.ok();
        });

        it('should set that user has agreed to terms-of-service', function() {
          expect(this.model.get('hasAgreedToTOS')).toBe(true);
        });

        it('should called continue on model', function() {
          expect(this.model.continue).toHaveBeenCalled();
        });
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
