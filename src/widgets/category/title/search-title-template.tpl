<% if (isSearchEnabled) { %>
  <form class="CDB-Widget-search js-form">
    <i class="CDB-IconFont CDB-IconFont-lens CDB-Widget-searchLens"></i>
    <input type="text" class="CDB-Widget-textInput CDB-Widget-searchTextInput js-textInput" value="<%- q %>" placeholder="Search by <%- columnName %>"/>
    <% if (canShowApply) { %>
      <button type="button" class="CDB-Widget-link CDB-Widget-searchApply js-applyLocked">apply</button>
    <% } %>
  </form>
<% } else { %>
  <div class="CDB-Widget-title CDB-Widget-contentSpaced">
    <h3 class="CDB-Widget-textBig" title="<%- title %>"><%- title %></h3>
    <div class="CDB-Widget-options CDB-Widget-contentSpaced">
      <button class="CDB-Widget-buttonIcon CDB-Widget-buttonIcon--circle js-colors
        <%- isColorApplied ? 'is-selected' : '' %>
        <%- isColorApplied ? 'js-cancelColors' : 'js-applyColors' %>
        " data-tooltip="
          <%- isColorApplied ? 'Remove colors' : 'Apply colors' %>
        ">
        <i class="CDB-IconFont CDB-IconFont-drop CDB-IconFont--small CDB-IconFont--top"></i>
      </button>
      <button class="CDB-Shape js-actions">
        <div class="CDB-Shape-threePoints is-blue is-small">
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
        </div>
      </button>
    </div>
  </div>
<% } %>
