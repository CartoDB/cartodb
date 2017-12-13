<div class="CDB-Widget-header js-header">
  <div class="js-torque-header"></div>

  <% if (showSource) { %>
    <div class="CDB-Widget-contentSpaced CDB-Widget-contentFull">
      <dl class="CDB-Widget-info u-tSpace">
        <div class="u-flex">
          <span class="CDB-Text CDB-Size-small is-semibold u-rSpace u-upperCase" style="color: <%- sourceColor %>;">
            <%- sourceId %>
          </span>
          <p class="CDB-Text CDB-Size-small u-mainTextColor u-ellipsis" title="<%= layerName %>">
            <%= sourceType %>
              <span class="u-altTextColor u-lSpace">
                <%= layerName %>
              </span>
          </p>
        </div>
      </dl>
    </div>
  <% } %>
</div>
