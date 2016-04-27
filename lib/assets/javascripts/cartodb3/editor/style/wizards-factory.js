var simpleWizardDefaults = require('./simple-wizard-defaults');


module.exports = {
  getWizardPropertiesByType: function (wizardType) {
    switch (wizardType) {
      case 'simple':
        return simpleWizardDefaults;
        break;
      default:
        console.log("Oh!");
    }
  }
}
