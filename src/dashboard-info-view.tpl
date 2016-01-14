<div class="CDB-Dashboard-infoInner">
  <div class="CDB-Dashboard-infoHeader">
    <div class="CDB-Dashboard-infoLogo">
      <i class="CDB-Icon CDB-Icon-cartofante"></i>
    </div>
    <div class="CDB-Dashboard-infoActions">
      <button class="CDB-Dashboard-infoActionsLink CDB-Dashboard-infoActionsLink--mobile js-toggle-view-link"></button>
    </div>
    <div class="CDB-Dashboard-infoTexts CDB-Dashboard-hideMobile">
      <p class="CDB-Dashboard-infoUpdate">UPDATED <%- updatedAt %></p>
      <h1 class="CDB-Dashboard-infoTitle"><%- title %></h1>
      <h2 class="CDB-Dashboard-infoDescription"><%- description %></h2>
    </div>
  </div>

  <div class="CDB-Dashboard-infoFooter">
    <ul>
      <li class="CDB-Dashboard-infoFooterItem ">
        <div class="CDB-Dashboard-infoMedia CDB-Dashboard-infoAvatar">
          <img src="<%- userAvatarURL %>" alt="avatar" class="inline-block"/>
        </div>
        <p class="CDB-Dashboard-infoFooterTxt"><%- userName %></p>
      </li>
    </ul>
  </div>
</div>

<div class="CDB-Dashboard-infoHeaderMobile u-showMobile">
  <div class="CDB-Dashboard-infoLogo">
    <i class="CDB-Icon CDB-Icon-cartofante"></i>
  </div>
  <button class="js-toggle-view-link">
    <span class="CDB-Shape CDB-Shape--hamburguer"></span>
  </button>
  <div class="CDB-Dashboard-infoMedia CDB-Dashboard-infoAvatar">
    <img src="<%- userAvatarURL %>" alt="avatar" class="inline-block"/>
  </div>
</div>
