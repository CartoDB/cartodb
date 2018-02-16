var _ = require('underscore');
var Utils = require('builder/helpers/utils');
var AnalysesQuotaOptions = require('./analyses-quota-options');
var CONTACT_LINK_TEMPLATE = _.template("<a href='mailto:<%- mail %>'><%- contact %></a>");

function getOwnerEmail (userModel) {
  return userModel._organizationModel && userModel._organizationModel.get('admin_email');
}

function getEmail (configModel, userModel) {
  var isSaas = configModel.get('cartodb_com_hosted') === false;
  var insideOrganization = userModel.isInsideOrg();
  var ownerOrganization = userModel.isOrgOwner();
  var email = _t('editor.layers.analysis-form.quota.emails.support');

  if (isSaas) {
    if (insideOrganization) {
      email = ownerOrganization ? _t('editor.layers.analysis-form.quota.emails.support') : getOwnerEmail(userModel);
    } else {
      email = _t('editor.layers.analysis-form.quota.emails.saas');
    }
  }

  return email;
}

function getMessage (configModel, userModel, notAssignedQuota) {
  var insideOrganization = userModel.isInsideOrg();
  var ownerOrganization = userModel.isOrgOwner();
  var message;

  if (notAssignedQuota) {
    if (insideOrganization && !ownerOrganization) {
      message = _t('editor.layers.analysis-form.quota.contact-message.no-quota-assigned.organization');
    } else {
      message = _t('editor.layers.analysis-form.quota.contact-message.no-quota-assigned.regular');
    }
  } else {
    if (insideOrganization && !ownerOrganization) {
      message = _t('editor.layers.analysis-form.quota.contact-message.no-credits.organization');
    } else {
      message = _t('editor.layers.analysis-form.quota.contact-message.no-credits.regular');
    }
  }

  return message;
}

var getNoCreditMessage = function (quota, type, configModel, userModel) {
  var link;
  var message;

  link = CONTACT_LINK_TEMPLATE({
    mail: getEmail(configModel, userModel),
    contact: getMessage(configModel, userModel, quota.totalQuota === 0)
  });

  if (quota.totalQuota === 0) {
    message = _t('editor.layers.analysis-form.quota.no-quota-assigned-body', {
      analysis: AnalysesQuotaOptions.getAnalysisName(type),
      contact: link
    });
  } else {
    message = _t('editor.layers.analysis-form.quota.no-credits-body', {
      contact: link
    });
  }

  return message;
};

module.exports = {
  make: function (data, configModel, userModel) {
    var blockPrice = Utils.formatNumber(data.quotaInfo.blockPrice / 100);
    var estimation = data.estimation;
    var formattedEstimation = Utils.formatNumber(estimation);
    var blockSize = Utils.formatNumber(data.quotaInfo.blockSize);
    var body = '';
    var type = '';
    var link;

    if (data.quotaInfo.hardLimit) {
      if (data.creditsLeft > 0) {
        if (data.quotaInfo.enoughQuota) {
          // You need to use approximately xxx of your credits.
          body = _t('editor.layers.analysis-form.quota.enough-quota', {
            credits: formattedEstimation
          });
          type = 'success';
        } else {
          // We're sorry the current quota is insufficient to enrich your data. Rows will be set to null and analysis may not complete. Please contact us to extend your quota for this function.
          link = CONTACT_LINK_TEMPLATE({
            mail: getEmail(configModel, userModel),
            contact: getMessage(configModel, userModel, false)
          });

          body = _t('editor.layers.analysis-form.quota.hard-limit-not-enough-quota', {
            contact: link
          });
          type = 'alert';
        }
      } else {
        // To get access to the [service] you will need more credits. Your current quota is not enough. Contact us.
        body = getNoCreditMessage(data.quotaInfo, data.type, configModel, userModel);
        type = 'alert';
      }
    } else {
      if (data.creditsLeft > 0) {
        // enoughQuota wil be true when soft_limit, becuase in this case, the api asume true
        if (data.creditsLeft >= estimation) {
          // You need to use some of your credits for this (data.estimation)
          body = _t('editor.layers.analysis-form.quota.enough-quota', {
            credits: formattedEstimation
          });
          type = 'success';
        } else {
          // Using this analysis component may incur extra fees depending on your account quota. Please review your current quota and/or request a larger allocation.
          body = _t('editor.layers.analysis-form.quota.soft-limit-enough-quota', {
            credits: formattedEstimation,
            blockSize: blockSize,
            blockPrice: blockPrice
          });
          type = 'alert';
        }
      } else {
        if (data.quotaInfo.totalQuota === 0) {
          body = getNoCreditMessage(data.quotaInfo, data.type, configModel, userModel);
        } else {
          // Using this analysis component may incur extra fees depending on your account quota. Please review your current quota and/or request a larger allocation.
          body = _t('editor.layers.analysis-form.quota.soft-limit-enough-quota', {
            credits: formattedEstimation,
            blockSize: blockSize,
            blockPrice: blockPrice
          });
        }
        type = 'alert';
      }
    }

    return {
      type: type,
      body: body
    };
  }
};
