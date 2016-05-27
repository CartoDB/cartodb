<button type="button" class="CDB-ListDecoration-itemLink
  <% if (isSelected) { %> is-selected <% } %> <% if (isDestructive) { %>  u-alertTextColor <% } else { %> u-actionTextColor <% } %>" title="<%- name %>">
  <div class="u-flex">
    <span class="SelectorLayer-letter CDB-Text CDB-Size-small u-whiteTextColor u-rSpace--m" style="background-color: <%- color %>;"><%- name.substr(0, 1) %></span> <%- name %>
  </div>
</button>

