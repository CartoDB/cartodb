<% if (isSearchEnabled) { %>
  <form class=" js-form">
    <input type="text" class=" js-textInput" placeholder="Search by column"/>
    <button type="button" class=" js-close">x</button>
  </form>
<% } else { %>
  <div class="Widget-title Widget-contentSpaced">
    <h3 class="Widget-textBig" title="<%- title %>"><%- title %></h3>
    <div class="Widget-options">
      <% if (canBeLocked) { %>
        <% if (isLocked) { %>
          <button class="js-unlock">unlock</button>
        <% } else { %>
          <button class="js-lock">lock</button>
        <% }  %>
      <% } %>
      <button>apply colors</button>
    </div>
  </div>
<% } %>
