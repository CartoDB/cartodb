var _ = require('underscore');

/**
 * type property should match the value given from the API.
 */
var ALL_OPTIONS = [{
  privacy: _t('components.modals.privacy.public.type'),
  title: _t('components.modals.privacy.public.title'),
  desc: _t('components.modals.privacy.public.body'),
  cssClass: 'is-green'
}, {
  privacy: _t('components.modals.privacy.link.type'),
  title: _t('components.modals.privacy.link.title'),
  desc: _t('components.modals.privacy.link.body'),
  cssClass: 'is-orange'
}, {
  privacy: _t('components.modals.privacy.password.type'),
  title: _t('components.modals.privacy.password.title'),
  desc: _t('components.modals.privacy.password.body')
}, {
  privacy: _t('components.modals.privacy.private.type'),
  title: _t('components.modals.privacy.private.title'),
  desc: _t('components.modals.privacy.private.body'),
  cssClass: 'is-red'
}];

module.exports = function (visDefinitionModel, userModel) {
  var isVisualization = visDefinitionModel.isVisualization();
  var actions = userModel.get('actions');
  var canSelectPremiumOptions = actions[ isVisualization ? 'private_maps' : 'private_tables' ];
  var currentPrivacy = visDefinitionModel.get('privacy');
  var availableOptions = visDefinitionModel.privacyOptions();

  return _.chain(ALL_OPTIONS)
    .filter(function (option) {
      debugger;
      return _.contains(availableOptions, option.privacy);
    })
    .map(function (option) {
      // Set state that depends on vis and user attrs, they should not vary during the lifecycle of this collection
      return _.defaults({
        selected: option.privacy === currentPrivacy,
        disabled: !(option.alwaysEnable || canSelectPremiumOptions)
      }, option);
    })
    .value();
};
