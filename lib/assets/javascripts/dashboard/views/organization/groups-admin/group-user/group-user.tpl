<a class="CDB-Text OrganizationList-userLink">
  <div class="OrganizationList-userAvatar UserAvatar">
    <img src="<%- avatarUrl %>" alt="<%- username %>" src="<%- username %>" class="UserAvatar-img UserAvatar-img--medium-large OrganizationList-userAvatar--img" />
  </div>
  <div class="OrganizationList-userInfo">
    <div class="OrganizationList-userInfoName">
      <h3 class="CDB-Size-medium OrganizationList-userInfoTitle u-ellipsLongText" title="<%- username %>">
        <%- username %>
      </h3>
      <h4 class="CDB-Text CDB-Size-small u-ellipis u-secondaryTextColor" title="<%- email %>">
        <%- email %>
      </h4>
    </div>
    <div class="OrganizationList-userInfoData CDB-Text CDB-Size-small u-altTextColor u-alignCenter">
      <p class="u-flex u-alignCenter">
        <i class="CDB-IconFont CDB-IconFont-map OrganizationList-userInfoData--paragraph-icon"></i>
        <%- maps_count %>
      </p>
      <p class="u-flex u-alignCenter u-lSpace--xl">
        <i class="CDB-IconFont CDB-IconFont-rows OrganizationList-userInfoData--paragraph-icon"></i>
        <%- table_count %>
      </p>
    </div>
  </div>
</a>
