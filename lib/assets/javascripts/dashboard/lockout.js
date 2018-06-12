const _ = require('underscore');
const $ = require('jquery');
const CartoNode = require('carto-node');
const DeleteAccountView = require('dashboard/components/delete-account/delete-account-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const ConfigModel = require('dashboard/data/config-model');
const UserModel = require('dashboard/data/user-model');

const client = new CartoNode.AuthenticatedClient();
const modals = new ModalsServiceModel();

const configModel = new ConfigModel(_.defaults({ base_url: window.user_data.base_url }, window.config));
const currentUser = new UserModel(window.user_data, { configModel });

$('.js-deleteAccount').click(function () {
  modals.create(modalModel =>
    new DeleteAccountView({
      userModel: currentUser,
      modalModel,
      client
    })
  );
});
