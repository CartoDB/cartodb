var Backbone = require('backbone');
var OptionModel = require('./option_model');
var _ = require('underscore');

/**
 * type property should match the value given from the API.
 */
var ALL_OPTIONS =[{
  type: 'public',
  illustrationType: 'positive',
  iconFontType: 'Unlock',
  title: 'Public',
  desc: 'Everyone can view your table and download it',
  enabled: true
},{
  type: 'link',
  illustrationType: 'alert',
  iconFontType: 'Unlock',
  title: 'With link',
  desc: 'Only people with a share link can view the data'
},{
  type: 'password',
  illustrationType: 'alert',
  iconFontType: 'Unlock--withEllipsis',
  title: 'Password protected',
  desc: 'Set a password and share only with specific people',
  removeThisForTableVis: true
},{
  type: 'private',
  illustrationType: 'negative',
  iconFontType: 'Lock',
  title: 'Private',
  desc: 'Nobody can access this dataset'
}];


/**
 * Collection that holds the different privacy options.
 */
module.exports = Backbone.Collection.extend({
  
  model: OptionModel
  
  
}, { // Class properties:
  
  /**
   * Get a privacy options collection from a Vis model
   *
   * Note that since the user's permissions should change very seldom, it's reasonable to assume they will be static for 
   * the collection's lifecycle, so set them on the models attrs when creating the collection.
   * collection is created.
   *  
   * @param vis {Object} instance of cdb.admin.Visualization
   * @param user {Object} instance of cdb.admin.User
   * @returns {Object} instance of this collection
   */
  byVisAndUser: function(vis, user) {
    var isVisualization = vis.isVisualization(); // or table
    var currentPrivacyType = vis.get('privacy').toLowerCase();
    var canSelectPremiumOptions = user.get('actions')[ isVisualization ? 'private_maps' : 'private_tables' ];

    return new this(
    _.chain(ALL_OPTIONS)
      .filter(function(option) {
        // Tables can't be password protected
        return isVisualization || !option.removeThisForTableVis
      })
      .map(function(option) {
        // Set state that depends on vis and user attrs, they should not vary during the lifecycle of this collection
        return _.defaults({
          selected: option.type === currentPrivacyType,
          enabled: option.enabled || canSelectPremiumOptions
        }, option);
      })
      .value()
    );
  }
});


