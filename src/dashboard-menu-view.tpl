<div class="CDB-Dashboard-menuInner">
  <div class="CDB-Dashboard-menuHeader">
    <div class="CDB-Dashboard-menuLogo">
      <i class="CDB-IconFont CDB-IconFont-cartoFante"></i>
    </div>
    <div class="CDB-Dashboard-menuActions">
      <button class="CDB-Shape CDB-Shape--medium js-toggle-view-link">
        <div class="CDB-Shape-threePoints is-horizontal is-medium is-white">
          <div class="CDB-Shape-threePointsItem is-round"></div>
          <div class="CDB-Shape-threePointsItem is-round"></div>
          <div class="CDB-Shape-threePointsItem is-round"></div>
        </div>
      </button>
    </div>
    <ul class="CDB-Dashboard-menuShare">
      <li class="CDB-Dashboard-menuShareItem">
        <a href="#" class="CDB-Dashboard-menuShareLink">
          <i class="CDB-IconFont CDB-IconFont-heartFill CDB-Size-large"></i>
        </a>
      </li>
      <li class="CDB-Dashboard-menuShareItem">
        <a href="#" class="CDB-Dashboard-menuShareLink">
          <i class="CDB-IconFont CDB-IconFont-twitter CDB-Size-large"></i>
        </a>
      </li>
      <li class="CDB-Dashboard-menuShareItem">
        <a href="#" class="CDB-Dashboard-menuShareLink">
          <i class="CDB-IconFont CDB-IconFont-facebook CDB-Size-medium"></i>
        </a>
      </li>
      <li class="CDB-Dashboard-menuShareItem">
        <a href="#" class="CDB-Dashboard-menuShareLink">
          <i class="CDB-IconFont CDB-IconFont-anchor CDB-Size-medium"></i>
        </a>
      </li>
    </ul>
    <div class="CDB-Dashboard-menuTexts CDB-Dashboard-hideMobile">
      <p class="CDB-Dashboard-menuUpdate">UPDATED <%- updatedAt %></p>
      <h1 class="CDB-Dashboard-menuTitle"><%- title %></h1>
      <h2 class="CDB-Dashboard-menuDescription"><%- description %></h2>
    </div>
  </div>

  <div class="CDB-Dashboard-menuFooter">
    <ul>
      <li class="CDB-Dashboard-menuFooterItem ">
        <div class="CDB-Dashboard-menuMedia CDB-Dashboard-menuAvatar">
          <img src="<%- userAvatarURL %>" alt="avatar" class="inline-block"/>
        </div>
        <p class="CDB-Dashboard-menuFooterTxt"><%- userName %></p>
      </li>
    </ul>
  </div>
</div>

<div class="CDB-Dashboard-menuHeaderMobile u-showMobile">
  <div class="CDB-Dashboard-menuLogo">
    <i class="CDB-IconFont CDB-IconFont-cartoFante"></i>
  </div>
  <button class="js-toggle-view-link">
    <span class="CDB-Shape CDB-Shape--hamburguer"></span>
  </button>
  <div class="CDB-Dashboard-menuMedia CDB-Dashboard-menuAvatar">
    <img src="<%- userAvatarURL %>" alt="avatar" class="inline-block"/>
  </div>
</div>
