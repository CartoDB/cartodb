<div class="CustomList-message">
  <p class="CustomList-messageText CDB-Text CDB-Size-medium u-secondaryTextColor">
    <% if (query && query.length) { %>
      <%- _t('components.custom-list.no-results', { typeLabel: typeLabel, query: query }) %>
    <% } else { %>
      <%- _t('components.custom-list.no-items', { typeLabel: typeLabel }) %>
    <% } %>
  </p>
</div>
