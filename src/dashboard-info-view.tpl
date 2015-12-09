<div class="CDB-Dashboard-infoHeader">
  <div class="CDB-Dashboard-infoLogo">
    <i class="CDB-Icon CDB-Icon-cartofante"></i>
  </div>
  <div class="CDB-Dashboard-infoActions">
    <button class="CDB-Dashboard-infoActionsLink js-toggle-view-link"></button>
  </div>
  <div class="CDB-Dashboard-infoTexts">
    <p class="CDB-Dashboard-infoUpdate">UPDATED <%- updatedAt %></p>
    <h1 class="CDB-Dashboard-infoTitle"><%- title %></h1>
    <h2 class="CDB-Dashboard-infoDescription"><%- description %></h2>
  </div>
</div>

<div class="CDB-Dashboard-infoFooter">
  <ul>
    <!--<li class="CDB-Dashboard-info-footer-item">
      <div class="CDB-Dashboard-info-media">
        <img src="/themes/img/icon-save.svg" alt="Save" />
      </div>
      <p class="CDB-Dashboard-info-footer-txt">Save snapshot</p>
    </li>
    <li class="CDB-Dashboard-info-footer-item">
      <div class="CDB-Dashboard-info-media">
        <img src="/themes/img/icon-share.svg" alt="share" />
      </div>
      <p class="CDB-Dashboard-info-footer-txt">Share view</p>
    </li>-->
    <li class="CDB-Dashboard-infoFooterItem">
      <div class="CDB-Dashboard-infoMedia CDB-Dashboard-infoAvatar">
        <img src="<%- userAvatarURL %>" alt="avatar" class="inline-block"/>
      </div>
      <p class="CDB-Dashboard-infoFooterTxt"><%- userName %></p>
    </li>
  </ul>
</div>
