<% if (type === 'button') { %>
  <button class="CDB-Button CDB-Button--secondary CDB-Button--small js-action">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small"><%= label %></span>
  </button>
<% } else { %>
  <button class="CDB-Button CDB-Button--small js-action" style="padding-left: 0; padding-right: 0;">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-actionTextColor"><%= label %></span>
  </button>
<% } %>