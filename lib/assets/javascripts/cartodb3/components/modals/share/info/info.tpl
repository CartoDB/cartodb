<% if (!loading) { %>
  <% if (isPublished) { %>
  <div class="CDB-Text CDB-Size-medium">
    <%= updatedOn %>
  </div>
  <% } else { %>
  <div>
    <h2 class="CDB-Text CDB-Size-large u-secondaryTextColor u-bSpace is-light"><%- _t('components.modals.share.unpublished-header') %></h2>
    <p class="CDB-Text CDB-Size-medium is-light"><%- _t('components.modals.share.unpublished-subheader') %></p>
  </div>
  <% } %>
<% } else { %>
<div class="CDB-LoaderIcon is-dark">
  <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
    <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
  </svg>
</div>
<% } %>