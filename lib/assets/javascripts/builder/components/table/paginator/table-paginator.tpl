<button class="Table-paginatorButton Table-paginatorButton--prev
  <% if (isPrevAvailable) { %>
    js-prev
  <% } %>
">
  <i class="CDB-IconFont is-semibold CDB-IconFont-lArrowLight CDB-Size-small
  <% if (isPrevAvailable) { %>
    u-actionTextColor
  <% } else { %>
    u-hintTextColor
  <% } %>
  "></i>
</button>
<p class="Table-paginatorText CDB-Text CDB-Size-small is-semibold u-upperCase">
  <% if (!size) {%>
   <span class="u-mainTextColor">…</span>
  <% } else { %>
    <span class="u-mainTextColor"><%- (page * 40) + 1 %></span>
    <span class="u-altTextColor u-lSpace u-rSpace"><%- _t('components.table.rows.paginator.to') %></span>
    <span class="u-mainTextColor"><%- (page * 40) + size %></span>
  <% } %>
</p>
<button class="Table-paginatorButton Table-paginatorButton--next
  <% if (isNextAvailable) { %>
    js-next
  <% } %>
">
  <i class="CDB-IconFont is-semibold CDB-IconFont-rArrowLight CDB-Size-small
  <% if (isNextAvailable) { %>
    u-actionTextColor
  <% } else { %>
    u-hintTextColor
  <% } %>
  "></i>
</button>
