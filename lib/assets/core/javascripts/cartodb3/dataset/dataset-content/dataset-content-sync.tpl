<p class="CDB-Text CDB-Size-small u-secondaryTextColor">
  <span class="SyncInfo-state SyncInfo-state--small SyncInfo-state--<%- state %> u-rSpace--s"></span>
  <span class="u-upperCase">
    <% if (state === "success") { %>
      <%- _t('dataset.sync.synced', { ranAt: ranAt }) %>.
    <% } else if (state === "syncing") { %>
      <%- _t('dataset.sync.syncing') %>...
    <% } else if (state === "failure") { %>
      <%- _t('dataset.sync.sync-failed') %>.
    <% } %>
  </span>

  <% if (state === "success") { %>
    <%- _t('dataset.sync.next', { runAt: runAt }) %>.
  <% } else if (state === "syncing") { %>
    <% /* There's no need to add extra text in this case. */ %>
  <% } else if (errorCode || errorMessage) { %>
    <%- _t('dataset.sync.error-code', { errorCode: errorCode }) %>: <%- errorMessage %>.
  <% } %>

  <% if (!fromExternalSource) { %>
    <% if (state !== "syncing") { %>
      <button class="<% if (canSyncNow) { %>u-actionTextColor js-syncNow<% } else { %>is-disabled js-syncNowDisabled<% } %>"><%- _t('dataset.sync.sync-now') %></button>.
    <% } %>
  <% } %>

  <% if (state !== "syncing") { %>
    <button class="js-options u-actionTextColor"><%- _t('dataset.sync.view-options') %></button>.
  <% } %>
</p>
