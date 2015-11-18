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
          <button class="Widget-buttonIcon Widget-buttonIcon--circle is-selected js-unlock">
            <i class="CDBIcon CDBIcon-Unlock"></i>
          </button>
        <% } else { %>
          <button class="Widget-buttonIcon Widget-buttonIcon--circle js-lock">
            <i class="CDBIcon CDBIcon-Unlock"></i>
          </button>
        <% }  %>
      <% } %>
      <button class="Widget-buttonIcon Widget-buttonIcon--circle">
        <i class="CDBIcon CDBIcon-Syringe"></i>
      </button>
    </div>
  </div>
<% } %>
