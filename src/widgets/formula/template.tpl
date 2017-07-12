<div class="CDB-Widget-header js-header">
  <div class="CDB-Widget-title CDB-Widget-contentSpaced">
    <h3 class="CDB-Text CDB-Size-large u-ellipsis <%- isCollapsed ? 'js-value is-collapsed' : 'js-title' %>"><% if (isCollapsed) { %><%- formatedValue %><% } else { %> <%- title %><% } %></h3>
    <div class="CDB-Widget-options">
      <button class="CDB-Shape CDB-Widget-actions js-actions">
        <div class="CDB-Shape-threePoints is-blue is-small">
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
        </div>
      </button>
    </div>
  </div>
  <% if (showSource) { %>
    <dl class="CDB-Widget-info u-tSpace">
      <div class="u-ellipsis u-flex">
        <span class="CDB-SelectorLayer-letter CDB-Text CDB-Size-small u-whiteTextColor u-rSpace u-upperCase" style="background-color: <%= sourceColor %>;"><%= sourceId %></span>
        <p class="CDB-Text CDB-Size-small u-mainTextColor u-ellipsis u-flex">
          <%= sourceType %> <span class="u-altTextColor u-lSpace u-ellipsis" title="<%= layerName %>"><%= layerName %></span>
        </p>
      </div>
    </dl>
  <% } %>
  <% if (showStats) { %>
    <dl class="CDB-Widget-info CDB-Text CDB-Size-small u-secondaryTextColor u-upperCase u-tSpace">
      <dt class="CDB-Widget-infoCount"><%- nulls %></dt><dd class="CDB-Widget-infoDescription">null rows</dd>
    </dl>
  <% } %>
</div>
<div class="CDB-Widget-content CDB-Widget-content--formula">
  <% if (_.isNumber(value)) { %>
    <h4 class="CDB-Text CDB-Size-huge <%- !isCollapsed ? 'js-value' : '' %>" title="<%- value %>">
      <%- prefix %><%- value %><%- suffix %>
    </h4>
    <% if (description) { %>
      <p class="CDB-Text CDB-Size-small u-tSpace js-description"><%- description %></p>
    <% } %>
  <% } else { %>
    <div class="CDB-Widget-listItem--fake"></div>
  <% } %>
</div>
