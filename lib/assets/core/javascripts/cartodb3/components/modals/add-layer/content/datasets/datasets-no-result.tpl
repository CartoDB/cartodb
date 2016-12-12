<div class="IntermediateInfo">
  <div class="LayoutIcon <% (q || tag) ? 'LayoutIcon--negative' : '' %>">
    <i class="CDB-IconFont
      <% if (shared) { %> CDB-IconFont-defaultUser
      <% } else if (locked) { %> CDB-IconFont-lock
      <% } else if (library) { %> CDB-IconFont-dribbble
      <% } else { %> CDB-IconFont-lens <% } %>" />
  </div>
  <h4 class="CDB-Text CDB-Size-large u-mainTextColor u-bSpace u-secondaryTextColor u-tSpace-xl">
    <% if (page > 1 || totalItems === 0 && totalEntries > 0) { %>
      <%- _t('components.modals.add-layer.datasets.no-results.desc') %>
    <% } %>

    <% if (( tag || q ) && totalItems === 0 && totalEntries === 0) { %>
      0 <%- tag || q %> <%- type %> <%- _t('components.modals.add-layer.datasets.no-results.found') %>
    <% } %>

    <% if (page === 1 && !tag && !q && totalItems === 0 && totalEntries === 0) { %>
      <%- _t('components.modals.add-layer.datasets.no-results.there-are-no') %> <%- shared === "only" ? 'shared' : '' %> <%- locked ? 'locked' : '' %> <%- library ? 'library' : '' %> <%- type %>
    <% } %>
  </h4>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    <% if (!tag && !q && totalItems === 0 && totalEntries === 0) { %>
      <%- _t('components.modals.add-layer.datasets.no-results.no-fun', { type: type }) %>
    <% } %>
  </p>
</div>
