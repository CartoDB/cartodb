import PermissionModel from 'dashboard/data/permission-model';

const VISUALIZATON_TYPES = {
  derived: 'derived',
  kuviz: 'kuviz',
  slide: 'slide',
  keplergl: 'keplergl'
};

export function isSharedWithMe (visualizationData, models) {
  return models.user.get('id') !== visualizationData.permission.owner.id;
}

export function getURL (visualizationData, models) {
  const isKuviz = visualizationData.type === VISUALIZATON_TYPES.kuviz;
  const isKepler = visualizationData.type === VISUALIZATON_TYPES.keplergl;
  if (isKuviz || isKepler) return visualizationData.url;

  const loggedUserBackboneModel = models.user;
  const loggedUserId = loggedUserBackboneModel.id || loggedUserBackboneModel.get('id');
  const permissionModel = new PermissionModel(
    visualizationData.permission, { configModel: models.config }
  );

  let id = visualizationData.id;
  let userUrl = permissionModel.owner.viewUrl();

  const isBuilderVisualization = visualizationData.type === VISUALIZATON_TYPES.derived || typeof visualizationData.type === 'undefined';
  if (isBuilderVisualization) {
    if (loggedUserBackboneModel &&
        loggedUserId !== permissionModel.owner.get('id') &&
        permissionModel.hasAccess(loggedUserBackboneModel)) {
      userUrl = loggedUserBackboneModel.viewUrl();
      id = `${permissionModel.owner.get('username')}.${id}`;
    }

    return userUrl.urlToPath('viz', id).get('base_url');
  } else {
    if (loggedUserBackboneModel && permissionModel.hasAccess(loggedUserBackboneModel)) {
      userUrl = loggedUserBackboneModel.viewUrl();
    }

    return userUrl.urlToPath('tables', getUnquotedName(visualizationData.table.name)).get('base_url');
  }
}

export function getThumbnailUrl (visualizationData, models, options) {
  const isKepler = visualizationData.type === VISUALIZATON_TYPES.keplergl;
  if (isKepler) {
    return visualizationData.thumbnailDataUrl;
  }

  const protocol = isHTTPS() ? 'https' : 'http';
  const cdnConfig = models.config.get('cdn_url');
  const username = visualizationData.permission.owner.username || models.user.get('username');
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

const getUnquotedName = function (name = '') {
  return name.replace(/"/g, '');
};
