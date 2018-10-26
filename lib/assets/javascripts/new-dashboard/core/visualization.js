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
