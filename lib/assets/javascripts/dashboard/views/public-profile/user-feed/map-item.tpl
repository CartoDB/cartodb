<li class="FeedItem">
  <a href="http://<%- username %>.<%- account_host %>" class="FeedItem-avatar">
    <img src="<%- avatar_url %>" class="UserAvatar-img UserAvatar-img--big" />
  </a>

  <div class="MapCard MapCard--borderless MapCard--long js-card" data-vis-id="<%- vis.id %>">
    <a href="<%- base_url %>/viz/<%- vis.id %>/public_map" class="MapCard-header js-header">
      <div class="MapCard-loader js-loader"></div>
    </a>

    <div class="MapCard-content">
      <div class="MapCard-contentBody">
        <div class="MapCard-contentBodyRow MapCard-contentBodyRow--flex">
          <h3 class="MapCard-title DefaultTitle CDB-Text is-semibold CDB-Size-large">
            <a href="<%- base_url %>/viz/<%- vis.id %>/public_map" class="DefaultTitle-link u-ellipsLongText" title="<%- vis.name %>"><%- vis.name %></a>
          </h3>
        </div>
      </div>

      <div class="MapCard-contentFooter CDB-Size-medium u-altTextColor">
        <div class="MapCard-contentFooterDetails--left">
          <div class="MapCard-contentFooterTimeDiff DefaultTimeDiff">
            <i class="CDB-IconFont CDB-IconFont-clock DefaultTimeDiff-icon"></i>
            <%- updated %>
          </div>
        </div>
      </div>
    </div>
  </div>
</li>
