<div class="ImportPanel-actions">
  <% if (state === "idle") { %>

    <button class="CDB-Button CDB-Button--primary js-connect"><span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Connect</span></button>
  <% } else if (state === "error") { %>
    <button class="CDB-Button CDB-Button--primary js-connect"><span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Try again</span></button>
  <% } else { %>
    <div class="Spinner ImportPanel-actionsLoader"></div>
  <% } %>
</div>
