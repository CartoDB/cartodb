var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var IconModel = require('./organization_icon_model');
//var cdb = require('cartodb.js-v3');

var icons = [
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/air.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/air2.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/anchor2.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/anchor3.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/bag1.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/bag2.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/balloon.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/black41.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/air.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/air2.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/anchor2.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/anchor3.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/bag1.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/bag2.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/balloon.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/black41.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/air.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/air2.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/anchor2.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/anchor3.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/bag1.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/bag2.svg?req=markup',
  'https://s3.amazonaws.com/com.cartodb.users-assets.production/pin-maps/balloon.svg?req=markup'
];

function createIcon (iconUrl) {
  var itemTemplate = '<li class="IconList-item IconList-item--small">';
  itemTemplate += '  <div class="IconItem-icon js-asset">';
  itemTemplate += '    <img height="24" src="' + iconUrl + '" alt="air" crossorigin="anonymous">';
  itemTemplate += '  </div>';
  itemTemplate += '</li>';

  return itemTemplate;
}

module.exports = cdb.core.View.extend({

  events: {
    'click .js-addIcon': '_onAddIconClicked',
    'change #iconfile': '_onFileSelected'
  },

  initialize: function() {
    if (!this.options.orgId) {
      throw new Error('Organization ID is required.');
    }
    this.template = cdb.templates.getTemplate('organization/organization_icon_picker');
    this.orgId = this.options.orgId;
    //this.model = new cdb.core.Model({ color: this.options.color });
    //this._initBinds();
    this.render();
  },

  render: function () {
    this.$el.html(this.template());

    _.each(icons, function (icon) {
      var iconTemplate = createIcon(icon);
      var $icon = $('<div/>').html(iconTemplate).contents();
      this.$('.js-items').append($icon);
    }, this);

    return this;
  },

  _initBinds: function() {
    // this.model.bind("change:color", this._onChangeColor, this);
  },

  _onAddIconClicked: function (evt) {
    this.$('#iconfile').trigger('click');
    evt.preventDefault();
  },

  _onFileSelected: function () {
    var file = this.$("#iconfile").prop('files');
    debugger;
    var iconUpload = new IconModel(
      null, {
        orgId: this.orgId
      }
    );

    iconUpload.save({
      kind: 'organization_asset',
      resource: file
    }, {
      success: this._onIconUploaded,
      error: this._onIconUploadError
    });
  },

  _onIconUploaded: function () {
    debugger;
  },

  _onIconUploadError: function () {
    debugger;
  },

  clean: function() {
  }
});
