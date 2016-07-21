<div class="Editor-HeaderInfoEditor">
  <div class="Editor-HeaderInfo-inner Editor-HeaderInfo-inner--wide">
    <div class="Editor-HeaderInfo-title u-bSpace--m">
      <div class="Editor-HeaderInfo-titleText u-bSpace js-header">
      </div>
      <div class="CDB-Shape">
        <button class="CDB-Shape-threePoints is-blue is-small js-toggle-menu">
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
          <div class="CDB-Shape-threePointsItem"></div>
        </button>
      </div>

    </div>
    <div class="u-bSpace--xl u-flex u-alignCenter">
      <button class="u-rSpace--m u-actionTextColor js-privacy">
        <i class="Tag Tag--outline <%- cssClass %> CDB-Text CDB-Size-small u-upperCase"><%- privacy %></i>
      </button>
      <img class="Share-user u-iBlock u-rSpace" src="<%- avatar %>">
      <% if (!isSimple) { %>
      <span class="u-iBlock js-share-users u-rSpace"></span>
      <% } %>
      <span class="CDB-Text CDB-Size-medium u-altTextColor u-lSpace"><%- published %></span>
    </div>
  </div>
</div>
