<% if (isSearchEnabled) { %>
  <form class="Widget-search js-form">
    <i class="CDBIcon CDBIcon-Lens Widget-searchLens"></i>
    <input type="text" class="Widget-textInput Widget-searchTextInput js-textInput" value="<%- q %>" placeholder="search by <%- columnName %>"/>
    <% if (canShowApply) { %>
      <button type="button" class="Widget-link Widget-searchApply js-apply">apply</button>
    <% } %>
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
            <i class="CDBIcon CDBIcon-Lock"></i>
          </button>
        <% }  %>
      <% } %>
      <button class="Widget-buttonIcon Widget-buttonIcon--circle">
        <i class="CDBIcon CDBIcon-Syringe"></i>
      </button>
    </div>
  </div>
<% } %>
