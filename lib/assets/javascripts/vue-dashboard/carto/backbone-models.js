import Factories from '../factories';

export default function createModels (data) {
  debugger;
  const configModel = Factories.ConfigModel(data.config);

  const userData = data.user;
  const organizationModel = userData.organization
    ? Factories.OrganizationModel(userData.organization, { configModel })
    : undefined;

  const userModel = Factories.UserModel(userData, {organization: organizationModel});
  const backgroundPollingModel = Factories.BackgroundPollingModel({
    showGeocodingDatasetURLButton: true,
    geocodingsPolling: true,
    importsPolling: true
  }, { configModel, userModel });

  return {
    configModel,
    userModel,
    backgroundPollingModel
  };
}
