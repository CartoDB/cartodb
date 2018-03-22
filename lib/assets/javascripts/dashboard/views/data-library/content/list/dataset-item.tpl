<div class="MapCard MapCard--borderless MapCard--squared js-card" data-vis-id="<%- vis.id %>" data-username="<%- vis.permission.owner.username %>">
  <a href="<%- dataset_base_url %><%- vis.name %>" target="_blank" class="MapCard-header js-header">
    <div class="MapCard-loader js-loader"></div>
  </a>

  <div class="MapCard-content">
    <div class="MapCard-contentFooter MapCard-contentFooter--with-icon">
      <div class="MapCard-contentFooterIcon">
        <div class="DatasetsList-itemCategory is--<%= geomType %>Dataset"></div>
      </div>
      <div class="MapCard-contentFooterDetails u-ellipsLongText">
        <div class="MapCard-contentFooterTitle">
          <h3 class="MapCard-title DefaultTitle CDB-Text is-semibold CDB-Size-large">
            <a href="<%- dataset_base_url %><%- vis.name %>" target="_blank" class="DefaultTitle-link u-ellipsLongText" title="<%- vis.display_name %>">
              <% if (vis.display_name) { %>
                <%- vis.display_name %>
              <% } else { %>
                <%- vis.name %>
              <% } %>
            </a>
          </h3>
        </div>

        <div class="MapCard-contentFooterIcons CDB-Size-medium u-altTextColor">
          <div class="MapCard-contentFooterDetails--left MapCard-contentFooterDetails--noright">
            <div class="MapCard-contentFooterTimeDiff DefaultTimeDiff">
              <i class="CDB-IconFont CDB-IconFont-clock DefaultTimeDiff-icon"></i>
              <%- dateFromNow %>
            </div>
            <% if (datasetSize && datasetSize[0] > 0) { %>
              <div class="MapCard-contentFooterIcon u-hideOnMobile">
                <i class="CDB-IconFont CDB-IconFont-floppy SizeIndicator-icon"></i>
                <span class="MapCardIcon-counter"><%- datasetSize[0] %></span> <span class="MapCardIcon-label"><%- datasetSize[1] %></span>
              </div>
            <% } %>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
