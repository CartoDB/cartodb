<div class="u-flex u-alignCenter CDB-Text CDB-Size-small u-altTextColor SyncInfo-message--<%- state %> js-state">
  <i class="CDB-IconFont CDB-IconFont-wifi"></i>
  <p class="u-upperCase is-semibold u-lSpace">
    <% if (errorCode || errorMessage) { %>
      <%- _t('dataset.sync.sync-failed') %>
    <% } else { %>
      <%- ranAt %>
    <% } %>
  </p>
</div>
<button class="CDB-Text CDB-Size-small u-upperCase js-options u-actionTextColor"><%- _t('dataset.sync.view-options') %></button>
