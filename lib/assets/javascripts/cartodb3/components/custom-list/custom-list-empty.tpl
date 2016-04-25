<ul class="CustomList-list js-list">
  <li>
    <% if (query.length) { %>
      <%- _t('components.custom-list.no-results', { typeLabel: typeLabel, query: query }) %>
    <% } else { %>
      <%- _t('components.custom-list.no-items', { typeLabel: typeLabel }) %>
    <% } %>
  </li>
</ul>
