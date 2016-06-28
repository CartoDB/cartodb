var PrivacyCollection = require('../../../../../../javascripts/cartodb3/components/modals/privacy/privacy-collection');

describe('components/modals/privacy/privacy-collection', function () {
  var collection;

  beforeEach(function () {
    collection = new PrivacyCollection();
  });

  describe('when reset with some options', function () {
    beforeEach(function () {
      collection.reset([{
        privacy: 'PUBLIC',
        title: 'Public',
        desc: 'Lorem ipsum',
        cssClass: 'is-green',
        selected: true
      }, {
        privacy: 'LINK',
        title: 'Link',
        desc: 'Yabadababa',
        cssClass: 'is-orange'
      }, {
        privacy: 'PASSWORD',
        title: 'Password',
        desc: 'Wadus'
      }, {
        privacy: 'PRIVATE',
        title: 'Private',
        desc: 'Funínculo',
        cssClass: 'is-red'
      }]);
    });

    it('should create a model for given data', function () {
      expect(collection.length).toEqual(4);
      expect(collection.at(0).get('title')).toEqual('Public');
      expect(collection.at(3).get('title')).toEqual('Private');
    });

    it('should return the selected option', function () {
      collection.at(2).set({selected: true});
      expect(collection.selectedOption().get('title')).toEqual('Password');
      collection.at(3).set({selected: true});
      expect(collection.selectedOption().get('title')).toEqual('Private');
    });

    it('should return the password option', function () {
      expect(collection.passwordOption().get('title')).toEqual('Password');
    });

    it('should only allow one selection at a time', function () {
      expect(collection.pluck('selected')).toEqual([true, false, false, false]);

      collection.last().set('selected', true);
      expect(collection.pluck('selected')).toEqual([false, false, false, true]);

      collection.first().set('selected', true);
      expect(collection.pluck('selected')).toEqual([true, false, false, false]);
    });
  });
});
