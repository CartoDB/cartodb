import PermissionModel from 'dashboard/data/permission-model';
import store from 'new-dashboard/store';

export function getURL (visualizationData) {
  const loggedUserBackboneModel = store.state.user.userModel;
  const permissionModel = new PermissionModel(
    visualizationData.permission, { configModel: store.state.config.configModel }
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
};
