<% if (closeToLimits && canUpgrade) { %>
  <div class="UpgradeElement">
    <div class="u-inner u-flex u-alignCenter u-justifySpace">
      <div class="UpgradeElement-info">
        <p class="UpgradeElement-infoText u-ellipsLongText CDB-Text">
          <% if (quotaPer <= 0) { %>
            <%= _t('dashboard.components.upgrade_messages.limit_reached') %>
          <% } else { %>
            <%= _t('dashboard.components.upgrade_messages.limit_reaching') %>
          <% } %>

          <% if (upgradeableWithoutContactingSales) { %>
            <%= _t('dashboard.components.upgrade_messages.upgrade') %>
          <% } %>
        </p>
      </div>
      <div class="UpgradeElement-actions">
        <% if (showTrial) { %>
          <div class="UpgradeElement-trial">
            <i class="CDB-IconFont CDB-IconFont-gift UpgradeElement-trialIcon"></i>
            <p class="UpgradeElement-trialText u-ellipsLongText CDB-Text"><%= _t('dashboard.components.upgrade_messages.free_trial') %></p>
          </div>
        <% } %>
        <% if (upgradeableWithoutContactingSales) { %>
          <a href="<%- upgradeUrl %>" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton CDB-Text">
            <span><%= _t('dashboard.components.upgrade_messages.upgrade_plan') %></span>
          </a>
        <% } else { %>
          <a href="mailto:<%= _t('email_sales') %>" class="Button Button--secondary UpgradeElement-button ChangePrivacy-upgradeActionButton CDB-Text">
            <span><%= _t('dashboard.components.upgrade_messages.contact_sales') %></span>
          </a>
        <% } %>
      </div>
    </div>
  </div>
<% } %>
