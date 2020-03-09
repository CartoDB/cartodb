var linkIconTemplate = require('builder/components/modals/publish/publish/icon-link.tpl');
var embedIconTemplate = require('builder/components/modals/publish/publish/icon-embed.tpl');

module.exports = function (visDefinitionModel) {
  return [{
    createIcon: function () {
      return linkIconTemplate();
    },
    type: 'get-link',
    content: visDefinitionModel.embedURL(),
    private: visDefinitionModel.get('privacy') === 'PRIVATE'
  }, {
    createIcon: function () {
      return embedIconTemplate();
    },
    type: 'embed',
    content: '<iframe width="100%" height="520" frameborder="0" src="' + encodeURI(visDefinitionModel.embedURL()) + '" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>',
    url: encodeURI(visDefinitionModel.embedURL()),
    private: visDefinitionModel.get('privacy') === 'PRIVATE'
  }];
};
