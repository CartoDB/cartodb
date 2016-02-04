<div class="CDB-Widget-header js-header">
  <div class="CDB-Widget-title CDB-Widget-contentSpaced">
    <div class="CDB-Widget-contentSpaced">
      <h3 class="CDB-Widget-textBig <%- isCollapsed ? 'js-value is-collapsed' : 'js-title' %>"><% if (isCollapsed) { %><%- formatedValue %><% } else { %> <%- title %><% } %></h3>
      <div class="CDB-Widget-tag CDB-Widget-tag--<%- operation %>">
        <span class="CDB-Widget-textSmaller CDB-Widget-textSmaller--upper"><%- operation %></span>
      </div>
    </div>
    <button class="CDB-Shape-threePoints js-actions">
      <span class="CDB-Shape-threePointsItem"></span>
    </button>
  </div>
  <dl class="CDB-Widget-info CDB-Widget-textSmaller CDB-Widget-textSmaller--upper">
    <dt class="CDB-Widget-infoCount"><%- nulls %></dt><dd class="CDB-Widget-infoDescription">null rows</dd>
  </dl>
</div>
<div class="CDB-Widget-content">
  <% if (_.isNumber(value)) { %>
    <h4 class="CDB-Widget-textBigger CDB-Widget-textBigger--maxWidth <%- !isCollapsed ? 'js-value' : '' %>" title="<%- value %>">
      <%- prefix %><%- value %><%- suffix %>
    </h4>
  <% } else { %>
    <div class="CDB-Widget-listItem--fake"></div>
  <% } %>
</div>
