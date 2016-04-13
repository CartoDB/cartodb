<% if (isSearchEnabled) { %>
  <form class="CDB-Widget-search js-form">
    <div class="CDB-Shape CDB-Widget-searchLens u-iBlock u-rSpace js-searchIcon">
      <span class="CDB-Shape-magnify is-small is-blue"></span>
    </div>
    <input type="text" class="CDB-Text CDB-Size-large CDB-Widget-textInput CDB-Widget-searchTextInput js-textInput" value="<%- q %>" placeholder="Search by <%- columnName %>"/>
    <% if (canShowApply) { %>
      <button type="button" class="CDB-Text is-semibold u-upperCase CDB-Size-small CDB-Widget-searchApply js-applyLocked u-actionTextColor">apply</button>
    <% } %>
  </form>
<% } else { %>
  <div class="CDB-Widget-title CDB-Widget-contentSpaced js-title">
    <h3 class="CDB-Text CDB-Size-large u-ellipsis js-titleText" title="<%- title %>"><%- title %></h3>
    <div class="CDB-Widget-options CDB-Widget-contentSpaced">
      <button class="CDB-Widget-buttonIcon CDB-Widget-buttonIcon--circle js-colors
        <%- isColorApplied ? 'is-selected' : '' %>
        <%- isColorApplied ? 'js-cancelAutoStyle' : 'js-autoStyle' %>
        " data-tooltip="
          <%- isColorApplied ? 'Remove colors' : 'Apply colors' %>
        ">
        <i class="CDB-IconFont CDB-IconFont-drop CDB-IconFont--small CDB-IconFont--top"></i>
      </button>
      <button class="CDB-Shape js-actions u-lSpace">
        <div class="CDB-Shape-threePoints is-blue is-small">
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
        </div>
      </button>
    </div>
  </div>
<% } %>
