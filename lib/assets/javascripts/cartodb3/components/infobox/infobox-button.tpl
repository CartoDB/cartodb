<% if (type === 'button') { %>
  <button class="CDB-Button CDB-Button--secondary CDB-Button--small <% if (disabled) { %>is-disabled<% } %> js-action">
    <span class="CDB-Button-Text CDB-Text is-semibold u-upperCase CDB-Size-small"><%= label %></span>
  </button>
<% } else { %>
  <button class="CDB-Button u-upperCase <% if (disabled) { %>is-disabled<% } %> js-action" style="padding-left: 0; padding-right: 0;">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-actionTextColor"><%= label %></span>
  </button>
<% } %>
