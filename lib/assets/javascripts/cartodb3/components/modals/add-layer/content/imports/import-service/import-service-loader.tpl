<div class="ImportPanel-actions">
  <% if (state === "idle") { %>
    <button class="Button Button--main ImportPanel-actionsButton js-connect">Connect</button>
  <% } else if (state === "error") { %>
    <button class="Button Button--main ImportPanel-actionsButton js-connect">Try again</button>
  <% } else { %>
    <div class="Spinner ImportPanel-actionsLoader"></div>
  <% } %>
</div>
