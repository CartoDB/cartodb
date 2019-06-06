<% if (closeToLimits && canUpgrade) { %>
  <div class="UpgradeElement">
    <div class="u-inner u-flex u-alignCenter u-justifyCenter">
      <div class="UpgradeElement-info">
        <p class="UpgradeElement-infoText u-ellipsLongText">
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

      <% if (upgradeableWithoutContactingSales) { %>
        &nbsp;
        <a href="<%- upgradeUrl %>" class="UpgradeElement-infoText">
          <span>Upgrade your plan.</span>
        </a>
      <% } else { %>
        &nbsp;
        <a href="mailto:sales@carto.com" class="UpgradeElement-infoText">
          <span>Talk to Sales.</span>
        </a>
      <% } %>
    </div>
  </div>
<% } %>
