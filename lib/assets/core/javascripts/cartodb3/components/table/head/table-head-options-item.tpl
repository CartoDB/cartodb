<% if (val === 'order') { %>
  <div class="CDB-ListDecoration-itemLink js-order">
    <div class="u-flex u-justifySpace">
      <p class="CDB-Text CDB-Size-medium"><%- name %></p>
      <ul class="u-flex">
        <li class="js-asc">
          <i class="CDB-IconFont
            CDB-IconFont-arrowNext u-actionTextColor
            Table-columnSorted
            Table-columnSorted--asc
            <% if (isOrderBy && sortBy === 'asc') { %>is-disabled<% } %>
            <% if (isOrderBy && sortBy === 'desc') { %>is-semibold<% } %>
          "></i>
        </li>
        <li class="js-desc u-lSpace--xl">
          <i class="CDB-IconFont
            CDB-IconFont-arrowNext u-actionTextColor
            Table-columnSorted
            Table-columnSorted--desc
            <% if (isOrderBy && sortBy === 'desc') { %>is-disabled<% } %>
            <% if (isOrderBy && sortBy === 'asc') { %>is-semibold<% } %>
          "></i>
        </li>
      </ul>
    </div>
  </div>
<% } else if (val === 'change') { %>
  <div class="CDB-ListDecoration-itemLink u-actionTextColor" title="<%- name %>">
    <div class="u-flex u-justifySpace u-alignCenter">
      <span><%- name %></span>
      <i class="CDB-IconFont CDB-Size-small is-semibold CDB-IconFont-rArrowLight"></i>
    </div>
  </div>
<% } else { %>
  <div
    class="CDB-ListDecoration-itemLink <% if (isDestructive) { %> u-errorTextColor <% } else { %> u-actionTextColor <% } %>"
    title="<%- name %>"
  >
    <%- name %>
  </div>
<% } %>
