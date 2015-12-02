<% if (isSearchEnabled) { %>
  <form class="CDB-Widget-search js-form">
    <i class="CDB-Icon CDB-Icon-lens CDB-Widget-searchLens"></i>
    <input type="text" class="CDB-Widget-textInput CDB-Widget-searchTextInput js-textInput" value="<%- q %>" placeholder="Search by <%- columnName %>"/>
    <% if (canShowApply) { %>
      <button type="button" class="CDB-Widget-link CDB-Widget-searchApply js-applyLocked">apply</button>
    <% } %>
  </form>
<% } else { %>
  <div class="CDB-Widget-title CDB-Widget-contentSpaced">
    <h3 class="CDB-Widget-textBig" title="<%- title %>"><%- title %></h3>
    <div class="CDB-Widget-options CDB-Widget-contentSpaced">
      <button class="CDB-Widget-buttonIcon CDB-Widget-buttonIcon--circle
        <%- isColorApplied ? 'is-selected' : '' %>
        <%- isColorApplied ? 'js-cancelColors' : 'js-applyColors' %>
        ">
        <i class="CDB-Icon CDB-Icon-syringe CDB-Icon--top"></i>
      </button>
      <button class="CDB-Shape-threePoints js-collapse">
        <span class="CDB-Shape-threePointsItem"></span>
      </button>
    </div>
  </div>
<% } %>
