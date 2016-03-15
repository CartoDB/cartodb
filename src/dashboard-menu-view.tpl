<div class="CDB-Dashboard-menuContainer">
  <div class="CDB-Dashboard-menuInner">
    <div class="CDB-Dashboard-menuHeader">
      <div class="CDB-Dashboard-menuLogo">
        <i class="CDB-IconFont CDB-IconFont-cartoFante"></i>
      </div>
      <div class="CDB-Dashboard-menuInfo">
        <button class="CDB-Shape CDB-Shape--medium js-toggle-view">
          <div class="CDB-Shape-threePoints is-horizontal is-medium is-white">
            <div class="CDB-Shape-threePointsItem is-round"></div>
            <div class="CDB-Shape-threePointsItem is-round"></div>
            <div class="CDB-Shape-threePointsItem is-round"></div>
          </div>
        </button>
      </div>
      <div class="CDB-Dashboard-menuInfo is-active">
        <button class="CDB-Shape CDB-Shape--medium js-toggle-view">
          <div class="CDB-Shape-threePoints is-horizontal is-medium">
            <div class="CDB-Shape-threePointsItem is-round"></div>
            <div class="CDB-Shape-threePointsItem is-round"></div>
            <div class="CDB-Shape-threePointsItem is-round"></div>
          </div>
        </button>
      </div>
      <ul class="CDB-Dashboard-menuActions">
        <li class="CDB-Dashboard-menuActionsItem">
          <a href="#" class="u-hintTextColor">
            <i class="CDB-IconFont CDB-IconFont-heartFill CDB-Size-large"></i>
          </a>
        </li>
        <li class="CDB-Dashboard-menuActionsItem">
          <a href="#" class="u-hintTextColor">
            <i class="CDB-IconFont CDB-IconFont-twitter CDB-Size-large"></i>
          </a>
        </li>
        <li class="CDB-Dashboard-menuActionsItem">
          <a href="#" class="u-hintTextColor">
            <i class="CDB-IconFont CDB-IconFont-facebook CDB-Size-medium"></i>
          </a>
        </li>
        <li class="CDB-Dashboard-menuActionsItem">
          <a href="#" class="u-hintTextColor">
            <i class="CDB-IconFont CDB-IconFont-anchor CDB-Size-medium"></i>
          </a>
        </li>
      </ul>
      <div class="CDB-Dashboard-menuTexts CDB-Dashboard-hideMobile">
        <p class="CDB-Text CDB-Size-small u-upperCase u-altTextColor u-bSpace--m js-timeAgo">UPDATED <%- updatedAt %></p>
        <h1 class="CDB-Dashboard-menuTitle CDB-Text CDB-Size-huge u-ellipsis js-title"><%- title %></h1>
        <h2 class="CDB-Text CDB-Size-large is-light u-secondaryTextColor js-description"><%= cdb.core.sanitize.html(description) %></h2>
      </div>
    </div>

    <div class="CDB-Dashboard-menuFooter">
      <ul>
        <li class="CDB-Dashboard-menuFooterItem ">
          <div class="CDB-Dashboard-menuMedia CDB-Dashboard-menuAvatar">
            <img src="<%- userAvatarURL %>" alt="avatar" class="inline-block"/>
          </div>
          <p class="CDB-Text CDB-Size-medium CDB-Dashboard-menuFooterTxt"><%- userName %></p>
        </li>
      </ul>
    </div>
  </div>
  <div class="CDB-Dashboard-bg js-toggle-view"></div>

  <div class="CDB-Dashboard-menuHeaderMobile u-showMobile">
    <div class="CDB-Dashboard-menuLogo">
      <i class="CDB-IconFont CDB-IconFont-cartoFante"></i>
    </div>
    <button class="js-toggle-view">
      <span class="CDB-Shape CDB-Shape--hamburguer"></span>
    </button>
    <div class="CDB-Dashboard-menuMedia CDB-Dashboard-menuAvatar">
      <img src="<%- userAvatarURL %>" alt="avatar" class="inline-block"/>
    </div>
  </div>
</div>
