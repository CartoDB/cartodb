<div class="CDB-Widget-header js-header">
  <div class="js-title"></div>
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
      <% if (showNulls) { %>
      <dt class="CDB-Widget-infoCount js-nulls">0</dt><dd class="CDB-Widget-infoDescription">NULL ROWS</dd>
      <% } %>
      <dt class="CDB-Widget-infoCount js-min">0</dt><dd class="CDB-Widget-infoDescription">MIN</dd>
      <dt class="CDB-Widget-infoCount js-avg">0</dt><dd class="CDB-Widget-infoDescription">AVG</dd>
      <dt class="CDB-Widget-infoCount js-max">0</dt><dd class="CDB-Widget-infoDescription">MAX</dd>
    </dl>
  <% } %>
</div>

<div class="CDB-Widget-content CDB-Widget-content--histogram js-content">
  <div class="CDB-Widget-filter CDB-Widget-contentSpaced ">
    <p class="CDB-Text CDB-Size-small is-semibold u-upperCase js-val">…</p>
    <div class="CDB-Widget-filterButtons js-filter is-hidden">
      <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor CDB-Widget-filterButton js-zoom">zoom</button>
      <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor CDB-Widget-filterButton js-clear">clear</button>
    </div>
  </div>
  <div class="js-mini-chart"></div>
  <div class="CDB-Chart--histogram js-chart"></div>
</div>
