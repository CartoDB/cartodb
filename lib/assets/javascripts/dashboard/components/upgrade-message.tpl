<% if (closeToLimits && canUpgrade) { %>
  <div class="UpgradeElement">
    <div class="u-inner u-flex u-alignCenter u-justifySpace">
      <div class="UpgradeElement-info">
        <p class="UpgradeElement-infoText u-ellipsLongText CDB-Text">
          <% if (quotaPer <= 0) { %>
            You have reached your limits.
          <% } else { %>
            You're reaching your account limits.
          <% } %>

          <% if (upgradeableWithoutContactingSales) { %>
            Upgrade your account to boost your quota.
          <% } %>
        </p>
      </div>
      <div class="UpgradeElement-actions">
        <% if (showTrial) { %>
          <div class="UpgradeElement-trial">
            <i class="CDB-IconFont CDB-IconFont-gift UpgradeElement-trialIcon"></i>
            <p class="UpgradeElement-trialText u-ellipsLongText CDB-Text">14 days Free trial</p>
          </div>
        <% } %>
        <% if (upgradeableWithoutContactingSales) { %>
          <a href="<%- upgradeUrl %>" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton CDB-Text">
            <span>upgrade your plan</span>
          </a>
        <% } else { %>
          <a href="mailto:sales@carto.com" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton CDB-Text">
            <span>Contact Sales</span>
          </a>
        <% } %>
      </div>
    </div>
  </div>
<% } %>
