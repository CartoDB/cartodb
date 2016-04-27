<div class="CustomList-message"
  <p class="CDB-Text CDB-Size-medium u-secondaryTextColor">
      <% if (query.length) { %>
        <%- _t('components.custom-list.no-results', { typeLabel: typeLabel, query: query }) %>
      <% } else { %>
        <%- _t('components.custom-list.no-items', { typeLabel: typeLabel }) %>
      <% } %>
  </p>
</div>
