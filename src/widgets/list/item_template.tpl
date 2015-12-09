<% if (isClickable) { %>
  <button type="button" class="CDB-Widget-listItemInner CDB-Widget-listButton CDB-Widget-listButton--withBorder js-button">
<% } else { %>
  <div class="CDB-Widget-listItemInner CDB-Widget-listItemInner--withBorders">
<% } %>
  <div class="CDB-Widget-contentSpaced CDB-Widget-contentSpaced--topAligned CDB-Widget-contentSpaced--start">
    <em class="CDB-Shape-dot CDB-Widget-listDot"></em>
    <% if (itemsCount > 0) { %>
      <div class="CDB-Widget-contentFull">
        <p class="CDB-Widget-textSmall CDB-Widget-textSmall--upper CDB-Widget-textSmall--bold" title="<%- items[0][1] %>"><%- items[0][1] %></p>
        <% if (itemsCount > 2) { %>
          <dl class="CDB-Widget-inlineList">
          <% for (var i = 1, l = itemsCount; i < l; i++) { %>
            <div class="CDB-Widget-inlineListItem CDB-Widget-textSmaller CDB-Widget-textSmaller--noEllip">
              <dd class="CDB-Widget-textSmaller--bold CDB-Widget-textSmaller--dark u-rSpace" title="<%- items[i][1] %>"><%- items[i][1] %></dd>
              <dt title="<%- items[i][0] %>"><%- items[i][0] %></dt>
            </div>
          <% } %>
          </dl>
        <% } else if (itemsCount === 2) { %>
          <dl class="CDB-Widget-textSmaller CDB-Widget-textSmaller--noEllip u-tSpace">
            <dd class="CDB-Widget-textSmaller--bold CDB-Widget-textSmaller--dark u-rSpace" title="<%- items[1][1] %>"><%- items[1][1] %></dd>
            <dt title="<%- items[1][0] %>"><%- items[1][0] %></dt>
          </dl>
        <% } %>
      </div>
    <% } %>
  </div>
<% if (isClickable) { %>
  </button>
<% } else { %>
  </div>
<% } %>
