<span class="CDB-Text CDB-Size-medium u-altTextColor Pagination-label">
  Page <%- currentPage %> of <%- pagesCount %>
</span>
<ul class="Pagination-list CDB-Text CDB-Size-medium">
  <% m.pagesToDisplay().forEach(function(page) { %>
    <% if (page > 0) { %>
      <li class="Pagination-listItem <%- m.isCurrentPage(page) ? 'is-current' : '' %>">
        <a class="Pagination-listItemInner Pagination-listItemInner--link js-listItem" href="<%- m.urlTo(page) %>" data-page="<%- page %>"><%- page %></a>
      </li>
    <% } else { %>
      <li class="Pagination-listItem Pagination-listItem">
        <span class="Pagination-listItemInner Pagination-listItemInner--more">&hellip;</span>
      </li>
    <% } %>
  <% }) %>
</ul>
