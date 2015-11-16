<% if (isSearchEnabled) { %>
  <form class=" js-form">
    <input type="text" class=" js-textInput" placeholder="Search by column"/>
    <button type="button" class=" js-close"></button>
  </form>
<% } else { %>
  <div class="Widget-title Widget-contentSpaced">
    <h3 class="Widget-textBig" title="<%- title %>"><%- title %></h3>
    <div class="Widget-options">
      <button>o</button>
      <button>o</button>
    </div>
  </div>
<% } %>
