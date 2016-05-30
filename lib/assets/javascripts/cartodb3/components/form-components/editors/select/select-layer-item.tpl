<button type="button" class="CDB-ListDecoration-itemLink
  <% if (isSelected) { %> is-selected <% } %> <% if (isDestructive) { %>  u-alertTextColor <% } else { %> u-actionTextColor <% } %>" title="<%- label %>">
  <div class="u-flex">
    <span class="SelectorLayer-letter CDB-Text CDB-Size-small u-whiteTextColor u-rSpace--m u-upperCase" style="background-color: <%- color %>;"><%- label.substr(0, 1) %></span> <%- label %>
  </div>
</button>

