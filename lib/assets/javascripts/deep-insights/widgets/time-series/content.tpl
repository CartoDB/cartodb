<div class="CDB-Widget-header js-header">
  <div class="js-title"></div>

  <% if (showSource) { %>
    <div class="CDB-Widget-contentSpaced CDB-Widget-contentFull">
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
    </div>
  <% } %>
</div>

<div class="CDB-Widget-content CDB-Widget-content--timeSeries js-content"></div>
