<button class="Table-paginatorButton Table-paginatorButton--prev
  <% if (isPrevAvailable) { %>
    js-prev
  <% } else { %>
    is-disabled
  <% } %>
"><</button>
<span class="Table-paginatorInfo u-upperCase">
  <% if (!size) {%>
    …
  <% } else { %>
    <strong><%- page * 40 %></strong> <%- _t('components.table.rows.paginator.to') %> <strong><%- (page * 40) + size %></strong>
  <% } %>
</span>
<button class="Table-paginatorButton Table-paginatorButton--next
  <% if (isNextAvailable) { %>
    js-next
  <% } else { %>
    is-disabled
  <% } %>
">></button>
