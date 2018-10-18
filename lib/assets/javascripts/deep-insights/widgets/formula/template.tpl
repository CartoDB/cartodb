<div class="CDB-Widget-header js-header">
  <div class="CDB-Widget-title CDB-Widget-contentSpaced">
    <h3 class="CDB-Text CDB-Size-large u-ellipsis js-title <%- isCollapsed ? 'is-collapsed' : '' %>"><%- title %></h3>
    <div class="CDB-Widget-options">
      <button class="CDB-Shape CDB-Widget-actions js-actions" data-tooltip="More options">
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
      <div class="u-flex u-alignCenter u-ellipsis">
        <span class="CDB-Text CDB-Size-small is-semibold u-upperCase" style="color: <%- sourceColor %>;">
          <%- sourceId %>
        </span>

        <% if (!isSourceType) { %>
          <span class="CDB-Text CDB-Size-small u-lSpace--s u-flex" style="color: <%- sourceColor %>;">
            <i class="CDB-IconFont CDB-IconFont-ray CDB-Size-small"></i>
          </span>
        <% } %>

        <span class="CDB-Text CDB-Size-small u-mainTextColor u-lSpace">
          <%= sourceType %>
        </span>

        <span class="CDB-Text CDB-Size-small u-altTextColor u-ellipsis u-lSpace" title="<%= layerName %>">
          <%= layerName %>
        </span>
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
      <%= prefix %><%- value %><%= suffix %>
    </h4>
    <% if (description) { %>
      <p class="CDB-Text CDB-Size-small u-tSpace js-description"><%- description %></p>
    <% } %>
  <% } else { %>
    <div class="CDB-Widget-listItem--fake"></div>
  <% } %>
</div>
