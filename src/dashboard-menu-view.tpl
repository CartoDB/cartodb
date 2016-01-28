<div class="CDB-Dashboard-menuInner">
  <div class="CDB-Dashboard-menuHeader">
    <div class="CDB-Dashboard-menuLogo">
      <i class="CDB-IconFont CDB-IconFont-cartoFante"></i>
    </div>
    <div class="CDB-Dashboard-menuActions">
      <button class="CDB-Dashboard-menuActionsLink CDB-Dashboard-menuActionsLink--mobile js-toggle-view-link">
        <i class="CDB-IconFont CDB-IconFont-arrowNext"></i>
      </button>
    </div>
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
