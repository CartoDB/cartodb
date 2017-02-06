var _ = require('underscore');
var AnalysesQuotaOptions = require('./analyses-quota-options');
var CONTACT_LINK_TEMPLATE = _.template("<a href='mailto:<%- mail %>'><%- contact %></a>");

var getNoCreditMessage = function (quota, type) {
  var link;
  var message;
  if (quota.totalQuota === 0) {
    link = CONTACT_LINK_TEMPLATE({
      mail: _t('editor.layers.analysis-form.quota.no-credits-mail'),
      contact: _t('editor.layers.analysis-form.quota.no-quota-assigned-contact')
    });
    message = _t('editor.layers.analysis-form.quota.no-quota-assigned-body', {
      analysis: AnalysesQuotaOptions.getAnalysisName(type),
      contact: link
    });
  } else {
    link = CONTACT_LINK_TEMPLATE({
      mail: _t('editor.layers.analysis-form.quota.no-credits-mail'),
      contact: _t('editor.layers.analysis-form.quota.no-credits-contact')
    });
    message = _t('editor.layers.analysis-form.quota.no-credits-body', {
      contact: link
    });
  }

  return message;
};

module.exports = {
  make: function (data) {

    // var QUOTA_DEFAULTS = {
    //   totalQuota: 0,
    //   usedQuota: 0,
    //   blockSize: 1000,
    //   blockPrice: 0,
    //   enoughQuota: true,
    //   hardLimit: true
    // };

    var blockPrice = (data.quotaInfo.blockPrice / 100);

    if (data.hardLimit) {
      if (data.creditsLeft > 0) {
        if (data.enoughQuota) {
          // You need to use some of your credits for this (data.estimation)
          // data.creditsLeft
        } else {
          // We're sorry the current quota is insufficient to enrich your data. Rows will be set to null and analysis may not complete. Please contact us to extend your quota for this function.
        }
      } else {
        // To get access to the [service] you will need more credits. Your current quota is not enough. Contact us.
        getNoCreditMessage(data.quotaInfo, data.type);
      }
    } else {
      if (data.creditsLeft > 0) {
        if (data.enoughQuota) {
          // You need to use some of your credits for this (data.estimation)
          // data.creditsLeft
        } else {
          // Using this analysis component may incur extra fees depending on your account quota. Please review your current quota and/or request a larger allocation.
        }
      } else {
        // Using this analysis component may incur extra fees depending on your account quota. Please review your current quota and/or request a larger allocation.
      }
    }

    return {
      type: 'alert',
      body: wadus
    };
  }
};

