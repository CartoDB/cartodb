<div class="CDB-Widget-header js-header">
  <div class="js-title"></div>

  <% if (showSource) { %>
    <div class="CDB-Widget-contentSpaced CDB-Widget-contentFull">
      <dl class="CDB-Widget-info u-tSpace">
        <div class="u-ellipsis u-flex">
          <span class="CDB-SelectorLayer-letter CDB-Text CDB-Size-small u-whiteTextColor u-rSpace u-upperCase" style="background-color: <%= sourceColor %>;"><%= sourceId %></span>
          <p class="CDB-Text CDB-Size-small u-secondaryTextColor u-ellipsis u-flex">
            <%= sourceType %> <span class="u-altTextColor u-lSpace u-ellipsis" title="<%= layerName %>"><%= layerName %></span>
          </p>
        </div>
      </dl>
    </div>
  <% } %>
</div>

<div class="CDB-Widget-content CDB-Widget-content--timeSeries js-content"></div>
