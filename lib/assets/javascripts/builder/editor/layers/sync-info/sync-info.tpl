<div class="u-flex u-alignCenter u-justifySpace">
  <div class="u-flex u-alignCenter CDB-Text CDB-Size-small u-altTextColor SyncInfo-message--<%- state %> js-state">
    <i class="CDB-IconFont CDB-IconFont-wifi"></i>

    <% if (isSubscription) { %>

      <p class="u-upperCase is-semibold u-lSpace">
        <% if (!errorCode && !errorMessage) { %>
          <%- modifiedAt %>
        <% } %>
      </p>

    <% } else { %>

      <p class="u-upperCase is-semibold u-lSpace">
        <% if (errorCode || errorMessage) { %>
          <%- _t('dataset.sync.sync-failed') %>
        <% } else { %>
          <%- ranAt %>
        <% } %>
      </p>

    <% } %>

  </div>

  <% if (isOwner && !isSubscription) { %>
    <button class="CDB-Text CDB-Size-small u-upperCase js-options SyncInfo-viewOptions"><%- _t('dataset.sync.view-options') %></button>
  <% } %>

</div>
