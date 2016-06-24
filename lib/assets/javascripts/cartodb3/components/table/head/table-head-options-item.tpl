<% if (val === 'order') { %>
  <div class="u-flex u-justifySpace CDB-ListDecoration-itemLink js-order">
    <p class="CDB-Text CDB-Size-medium"><%- name %></p>
    <ul class="u-flex">
      <li class="js-asc">
        <i class="CDB-Text CDB-IconFont
          CDB-IconFont-arrowNext u-actionTextColor
          Table-columnSorted
          Table-columnSorted--asc
           <% if (isOrderBy && sortBy === 'asc') { %>is-disabled<% } %>
           <% if (isOrderBy && sortBy === 'desc') { %>is-semibold<% } %>
        "></i>
      </li>
      <li class="js-desc u-lSpace--xl">
        <i class="CDB-Text CDB-IconFont
          CDB-IconFont-arrowNext u-actionTextColor
          Table-columnSorted
          Table-columnSorted--desc
           <% if (isOrderBy && sortBy === 'desc') { %>is-disabled<% } %>
           <% if (isOrderBy && sortBy === 'asc') { %>is-semibold<% } %>
        "></i>
      </li>
    </ul>
  </div>
<% } else if (val === 'change') { %>
  <div class="CDB-ListDecoration-itemLink u-actionTextColor u-flex u-justifySpace u-alignCenter" title="<%- name %>">
    <span><%- name %></span>
    <i class="CDB-Text CDB-Size-small is-semibold CDB-IconFont CDB-IconFont-rArrowLight"></i>
  </div>
<% } else { %>
  <div class="CDB-ListDecoration-itemLink
    <% if (isDestructive) { %>  u-errorTextColor <% } else { %> u-actionTextColor <% } %>
    <% if (val === 'change') { %> u-flex <% } %>
    " title="<%- name %>">
    <%- name %>
    <% if (val === 'change') { %>
      <span>
        <i class="CDB-Text CDB-Size-small is-semibold CDB-IconFont CDB-IconFont-rArrowLight"></i>
      </span>
    <% } %>
  </div>
<% } %>
