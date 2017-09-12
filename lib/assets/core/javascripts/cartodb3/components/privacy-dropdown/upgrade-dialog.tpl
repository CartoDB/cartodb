<div class="CDB-Box-Modal Editor-boxModalContent">
  <p class="CDB-Text CDB-Size-medium u-bSpace--m"><%- _t('components.modals.publish.privacy.upgrade_dialog.title') %></p>
  <% if (showTrial) { %>
  <div>
    <p class="CDB-Text CDB-Size-medium u-bSpace--m u-ellipsLongText"><%- _t('components.modals.publish.privacy.upgrade_dialog.trial', {days: 14}) %></p>
  </div>
  <% } %>
  <a href="<%- upgradeURL %>" class="CDB-Button CDB-Button--primary CDB-Button--small CDB-Size-small CDB-Text u-upperCase u-rSpace--m is-semibold">
    <%- _t('components.modals.publish.privacy.upgrade_dialog.upgrade') %>
  </a>
</div>
