var _ = require('underscore');

/**
 * type property should match the value given from the API.
 */
var ALL_OPTIONS = [{
  privacy: 'PUBLIC',
  title: _t('components.modals.publish.privacy.public.title'),
  desc: _t('components.modals.publish.privacy.public.body'),
  alwaysEnabled: true,
  cssClass: 'green'
}, {
  privacy: 'LINK',
  title: _t('components.modals.publish.privacy.link.title'),
  desc: _t('components.modals.publish.privacy.link.body'),
  cssClass: 'orange'
}, {
  privacy: 'PASSWORD',
  title: _t('components.modals.publish.privacy.password.title'),
  desc: _t('components.modals.publish.privacy.password.body'),
  cssClass: 'orange-dark'
}, {
  privacy: 'PRIVATE',
  title: _t('components.modals.publish.privacy.private.title'),
  desc: _t('components.modals.publish.privacy.private.body'),
  cssClass: 'red'
}];

function canChangeToPrivate (userModel, currentPrivacy, option) {
  return currentPrivacy !== 'PRIVATE' && option.privacy === 'PRIVATE' && userModel.hasRemainingPrivateMaps();
}

function canChangeToPublic (userModel, currentPrivacy, option) {
  return currentPrivacy !== 'PRIVATE' || currentPrivacy === 'PRIVATE' && option.privacy !== 'PRIVATE' && userModel.hasRemainingPublicMaps();
}

module.exports = function (visDefinitionModel, userModel) {
  var isVisualization = visDefinitionModel.isVisualization();
  var actions = userModel.get('actions');
  var canSelectPremiumOptions = actions[ isVisualization ? 'private_maps' : 'private_tables' ];
  var currentPrivacy = visDefinitionModel.get('privacy');
  var availableOptions = visDefinitionModel.privacyOptions();
  let publicSharingIsDisabled = isVisualization ? userModel.hasPublicMapSharingDisabled() : userModel.hasPublicDatasetSharingDisabled();

  return _.chain(ALL_OPTIONS)
    .filter(function (option) {
      return _.contains(availableOptions, option.privacy);
    })
    .map(function (option) {
      // Set state that depends on vis and user attrs, they should not vary during the lifecycle of this collection
      var privacyEnabled = (option.privacy === 'PRIVATE'
        ? canChangeToPrivate(userModel, currentPrivacy, option)
        : canChangeToPublic(userModel, currentPrivacy, option));

      var DEFAULT_ENABLEMENT_FOR_TABLE = true;
      var premiumEnabled = isVisualization ? (canSelectPremiumOptions && privacyEnabled) : DEFAULT_ENABLEMENT_FOR_TABLE;

      var publicMustBeDisabled = (option.privacy !== 'PRIVATE' && publicSharingIsDisabled);

      var enabled = ((option.alwaysEnabled || premiumEnabled) && !publicMustBeDisabled) || option.privacy === 'PRIVATE';
      return _.defaults({
        selected: option.privacy === currentPrivacy,
        disabled: !enabled
      }, option);
    })
    .value();
};
