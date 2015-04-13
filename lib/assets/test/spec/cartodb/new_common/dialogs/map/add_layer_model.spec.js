var AddLayerModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/map/add_layer_model');
var sharedForCreateListingViewModel = require('../create/shared_for_create_listing_view_model');
var sharedForCreateListingImportViewModel = require('../create/listing/shared_for_import_view_model');
var sharedForCreateFromScratchViewModel = require('../create/listing/shared_for_create_from_scratch_view_model');

describe('new_common/dialogs/map/add_layer_model', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://cartodb.com'
    });

    this.model = new AddLayerModel({
    }, {
      user: this.user
    });
  });

  sharedForCreateListingViewModel.call(this);
  sharedForCreateListingImportViewModel.call(this);
  sharedForCreateFromScratchViewModel.call(this);
});
