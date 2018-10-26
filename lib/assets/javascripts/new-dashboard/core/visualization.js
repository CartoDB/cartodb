import PermissionModel from 'dashboard/data/permission-model';

export function getURL (visualizationData, models) {
  const loggedUserBackboneModel = models.user;
  const permissionModel = new PermissionModel(
    visualizationData.permission, { configModel: models.config }
  );

  let id = visualizationData.id;
  let userUrl = permissionModel.owner.viewUrl();

  if (loggedUserBackboneModel &&
      loggedUserBackboneModel.id !== permissionModel.owner.get('id') &&
      permissionModel.hasAccess(loggedUserBackboneModel)) {
    userUrl = loggedUserBackboneModel.viewUrl();
    id = `${permissionModel.owner.get('username')}.${id}`;
  }

  return `${userUrl.toString()}/viz/${id}`;
}

export function getThumbnailUrl (visualizationData, models, options) {
  const protocol = isHTTPS() ? 'https' : 'http';
  const cdnConfig = models.config.get('cdn_url');
  const username = models.user.get('username');

  const thumbnailOptions = {
    protocol,
    username,
    mapsApiResource: models.config.getMapsResourceName(username),
    tpl: _generateImageTemplate(visualizationData.id),
    width: options.width,
    height: options.height,
    authTokens: _generateAuthTokensParams(visualizationData.auth_tokens)
  };

  if (cdnConfig) {
    Object.assign(thumbnailOptions, { cdn: cdnConfig[protocol] });
  }

  return interpolateTemplateUrl(cdnConfig ? 'cdn' : 'regular', thumbnailOptions);
}

const interpolateTemplateUrl = function (type, options) {
  if (type === 'regular') {
    return `${options.protocol}://${options.mapsApiResource}/api/v1/map/static/named/${options.tpl}/${options.width}/${options.height}.png${options.authTokens}`;
  }

  if (type === 'cdn') {
    return `${options.protocol}://${options.cdn}/${options.username}/api/v1/map/static/named/${options.tpl}/${options.width}/${options.height}.png${options.authTokens}`;
  }
};

const _generateAuthTokensParams = function (authTokens) {
  if (authTokens && authTokens.length > 0) {
    return '?' + authTokens.map(t => `auth_token=${t}`).join('&');
  }

  return '';
};

const _generateImageTemplate = function (visualizationId) {
  return `tpl_${visualizationId.replace(/-/g, '_')}`;
};

const isHTTPS = function () {
  return location.protocol.indexOf('https') === 0;
};
