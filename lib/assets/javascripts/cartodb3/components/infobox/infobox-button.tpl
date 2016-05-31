<% if (type === 'link') { %>
  <p class="CDB-Text is-semibold CDB-Size-small"><a href="#" class="js-action"><%= label %></a></p>
<% } else { %>
  <button class="CDB-Button CDB-Button--secondary CDB-Button--small js-action">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small"><%= label %></span>
  </button>
<% } %>