<div class="CDB-Dashboard-info-header">
  <div class="CDB-Dashboard-info-logo">
    <i class="CDB-Icon CDB-Icon-Cartofante"></i>
  </div>
  <div class="CDB-Dashboard-info-actions">
    <button class="CDB-Dashboard-info-actions-link js-toggle-view-link"></button>
  </div>
  <div class="CDB-Dashboard-info-texts">
    <p class="CDB-Dashboard-info-update">UPDATED <%- updatedAt %></p>
    <h1 class="CDB-Dashboard-info-title"><%- title %></h1>
    <h2 class="CDB-Dashboard-info-description"><%- description %></h2>
  </div>
</div>

<div class="CDB-Dashboard-info-footer">
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
    <li class="CDB-Dashboard-info-footer-item">
      <div class="CDB-Dashboard-info-media CDB-Dashboard-info-avatar">
        <img src="<%- userAvatarURL %>" alt="avatar" class="inline-block"/>
      </div>
      <p class="CDB-Dashboard-info-footer-txt"><%- userName %></p>
    </li>
  </ul>
</div>
