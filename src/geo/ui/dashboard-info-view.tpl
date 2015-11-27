<div class="Dashboard-info-header">
  <div class="Dashboard-info-logo">
    <i class="CDBIcon CDBIcon-Cartofante"></i>
  </div>
  <div class="Dashboard-info-actions">
    <a href="#" class="Dashboard-info-actions-link js-toggle-view-link"></a>
  </div>
  <div class="Dashboard-info-texts">
    <p class="Dashboard-info-update">UPDATED <%- updatedAt %></p>
    <h1 class="Dashboard-info-title"><%- title %></h1>
    <h2 class="Dashboard-info-description"><%- description %></h2>
  </div>
</div>

<div class="Dashboard-info-footer">
<!--   <div class="Dashboard-info-snapshots">
    <ul class="Dashboard-info-snapshots-list">
      <li class="Dashboard-info-snapshots-list-item">
        <h3 class="Dashboard-info-snapshots-list-title">NAMED SNAPSHOT</h3>
        <p class="Dashboard-info-snapshots-list-date">08/10 · 17:35</p>
      </li>
      <li class="Dashboard-info-snapshots-list-item">
        <h3 class="Dashboard-info-snapshots-list-title">NAMED SNAPSHOT</h3>
        <p class="Dashboard-info-snapshots-list-date">08/10 · 17:35</p>
      </li>
      <li class="Dashboard-info-snapshots-list-item">
        <h3 class="Dashboard-info-snapshots-list-title">NAMED SNAPSHOT</h3>
        <p class="Dashboard-info-snapshots-list-date">08/10 · 17:35</p>
      </li>
      <li class="Dashboard-info-snapshots-list-item">
        <h3 class="Dashboard-info-snapshots-list-title">NAMED SNAPSHOT</h3>
        <p class="Dashboard-info-snapshots-list-date">08/10 · 17:35</p>
      </li>
    </ul>
  </div>
 -->  <ul>
    <li class="Dashboard-info-footer-item">
      <div class="Dashboard-info-media">
        <img src="/themes/img/icon-save.svg" alt="Save" />
      </div>
      <p class="Dashboard-info-footer-txt">Save snapshot</p>
    </li>
    <li class="Dashboard-info-footer-item">
      <div class="Dashboard-info-media">
        <img src="/themes/img/icon-share.svg" alt="share" />
      </div>
      <p class="Dashboard-info-footer-txt">Share view</p>
    </li>
    <li class="Dashboard-info-footer-item">
      <div class="Dashboard-info-media Dashboard-info-avatar">
        <img src="<%- userAvatarURL %>" alt="avatar" class="inline-block"/>
      </div>
      <p class="Dashboard-info-footer-txt"><%- userName %></p>
    </li>
  </ul>
</div>
