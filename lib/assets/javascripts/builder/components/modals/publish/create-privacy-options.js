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

module.exports = function (visDefinitionModel, userModel) {
  var isVisualization = visDefinitionModel.isVisualization();
  var actions = userModel.get('actions');
  var canSelectPremiumOptions = actions[ isVisualization ? 'private_maps' : 'private_tables' ];
  var currentPrivacy = visDefinitionModel.get('privacy');
  var availableOptions = visDefinitionModel.privacyOptions();

  return _.chain(ALL_OPTIONS)
    .filter(function (option) {
      return _.contains(availableOptions, option.privacy);
    })
    .map(function (option) {
      // Set state that depends on vis and user attrs, they should not vary during the lifecycle of this collection
      return _.defaults({
        selected: option.privacy === currentPrivacy,
        disabled: !(option.alwaysEnabled || canSelectPremiumOptions)
      }, option);
    })
    .value();
};
