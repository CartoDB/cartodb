const _ = require('underscore');
const $ = require('jquery');
const CartoNode = require('carto-node');
const DeleteAccountView = require('dashboard/components/delete-account/delete-account-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const ConfigModel = require('dashboard/data/config-model');
const UserModel = require('dashboard/data/user-model');
const LocalStorage = require('dashboard/helpers/local-storage');

const client = new CartoNode.AuthenticatedClient();
const modals = new ModalsServiceModel();
const errorsStorage = new LocalStorage('carto-errors');

const configModel = new ConfigModel(_.defaults({ base_url: window.user_data.base_url }, window.config));
const currentUser = new UserModel(window.user_data, { configModel });

$('.js-deleteAccount').click(function () {
  const onError = ({ responseJSON }) => {
    errorsStorage.set({
      lockout: { responseJSON }
    });

    window.location.href = `${configModel.prefixUrl()}/account`;
  };

  modals.create(modalModel =>
    new DeleteAccountView({
      userModel: currentUser,
      modalModel,
      onError,
      client
    })
  );
});
