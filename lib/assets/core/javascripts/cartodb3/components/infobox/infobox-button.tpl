<% if (type === 'primary') { %>
  <button class="CDB-Button CDB-Button--primary CDB-Button--medium <% if (disabled) { %>is-disabled<% } %> js-<%- action %> js-action">
    <span class="CDB-Button-Text CDB-Text is-semibold u-upperCase CDB-Size-small"><%= label %></span>
  </button>
<% } else if (type === 'secondary') { %>
  <button class="CDB-Button CDB-Button--secondary CDB-Button--medium <% if (disabled) { %>is-disabled<% } %> js-<%- action %> js-action">
    <span class="CDB-Button-Text CDB-Text is-semibold u-upperCase CDB-Size-small"><%= label %></span>
  </button>
<% } else { %>
  <button class="Infobox-buttonLink u-upperCase <% if (disabled) { %>is-disabled<% } %> js-<%- action %> js-action CDB-Text is-semibold CDB-Size-small">
    <%= label %>
  </button>
<% } %>
