<li class="Modal-actions-button">
  <button class="CDB-Button CDB-Button--secondary js-done">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.share.done-btn') %></span>
  </button>
</li>
<% if (!isUpdated) { %>
<li class="Modal-actions-button">
  <button class="CDB-Button CDB-Button--primary js-update">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.share.publish-btn') %></span>
  </button>
</li>
<% } %>