var ChangePrivacyDialog = require('new_dashboard/dialogs/change_privacy_view');
var cdb = require('cartodb.js');

describe('new_dashboard/dialogs/change_privacy_view', function() {
  beforeEach(function() {
    this.item = new cdb.core.Model({ name: 'foobar' });

    this.view = new ChangePrivacyDialog({
      item: this.item
    });
    this.view.render(); 
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });
});

