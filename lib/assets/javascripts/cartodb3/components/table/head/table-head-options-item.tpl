<% if (val === 'order') { %>
  <div class="u-flex u-justifySpace">
    <p class="CDB-Text CDB-Size-medium"><%- name %></p>
    <div class="u-flex">
      <button class="js-asc">
        <i class="CDB-IconFont CDB-IconFont-arrowNext"></i>
      </button>
      <button class="js-desc">
        <i class="CDB-IconFont CDB-IconFont-arrowNext"></i>
      </button>
    </div>
  </div>
<% } else if (val === 'change') { %>
  <button type="button" class="CDB-ListDecoration-itemLink u-actionTextColor u-flex
    " title="<%- name %>">
    <span><%- name %></span>
    <i class="CDB-IconFont CDB-IconFont-rArrow"></i>
  </button>
<% } else { %>
  <button type="button" class="CDB-ListDecoration-itemLink
    <% if (isDestructive) { %>  u-alertTextColor <% } else { %> u-actionTextColor <% } %>
    <% if (val === 'change') { %> u-flex <% } %>
    " title="<%- name %>">
    <%- name %>
    <% if (val === 'change') { %>
      <span>
        <i class="CDB-IconFont CDB-IconFont-rArrow"></i>
      </span>
    <% } %>
  </button>
<% } %>
