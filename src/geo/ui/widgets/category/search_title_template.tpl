<% if (isSearchEnabled) { %>
  <form class="Widget-form js-form">
    <i class="CDBIcon CDBIcon-Lens"></i>
    <input type="text" class="Widget-textInput js-textInput" placeholder="Search by name"/>
    <button type="button" class=" js-close">
      <i class="CDBIcon CDBIcon-X"></i>
    </button>
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
