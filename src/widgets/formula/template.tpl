<div class="CDB-Widget-header js-header">
  <div class="CDB-Widget-title CDB-Widget-contentSpaced">
    <div class="CDB-Widget-contentSpaced">
      <h3 class="CDB-Widget-textBig js-title<%- isCollapsed ? ' is-collapsed' : '' %>"><% if (isCollapsed) { %><%- formatedValue %><% } else { %> <%- title %><% } %></h3>
      <div class="CDB-Widget-tag CDB-Widget-tag--<%- operation %>">
        <span class="CDB-Widget-textSmaller CDB-Widget-textSmaller--upper"><%- operation %></span>
      </div>
    </div>
    <button class="CDB-Shape-threePoints js-actions">
      <span class="CDB-Shape-threePointsItem"></span>
    </button>
  </div>
  <dl class="CDB-Widget-info">
    <dt class="CDB-Widget-infoItem CDB-Widget-textSmaller CDB-Widget-textSmaller--upper"><%- nulls %> null rows</dt>
  </dl>
</div>
<div class="CDB-Widget-content">
  <% if (value) { %>
    <h4 class="CDB-Widget-textBigger CDB-Widget-textBigger--maxWidth js-value" title="<%- value %>">
      <%- prefix %><%- value %><%- suffix %>
    </h4>
  <% } else { %>
    <div class="CDB-Widget-listItem--fake"></div>
  <% } %>
</div>
