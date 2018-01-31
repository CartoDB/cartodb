<div class="CDB-Widget-title CDB-Widget-contentSpaced">
  <h3 class="CDB-Text CDB-Size-large u-ellipsis" title="<%- title %>"><%- title %></h3>
</div>

<h2 class="CDB-Text CDB-Size-small is-semibold u-upperCase u-tSpace"><%- error %></h2>

<div class="CDB-Text CDB-Size-medium u-tSpace-xl"><%- message %></div>

<% if (refresh) { %>
  <button class="CDB-Button CDB-Button--secondary CDB-Button--medium u-tSpace-xl js-refresh">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium">REFRESH</span>
  </button>
<% }  else { %>
  <%= placeholder %>
<% } %>

