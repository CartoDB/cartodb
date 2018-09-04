<div class="CDB-Text Dialog-content Dialog-content--expanded">
  <div class="Dialog-header Dialog-header--expanded CreateDialog-header">
    <ul class="CreateDialog-headerSteps">
      <li class="CreateDialog-headerStep CreateDialog-headerStep--single">
        <div class="Dialog-headerIcon Dialog-headerIcon--neutral">
          <i class="CDB-IconFont CDB-IconFont-boss"></i>
        </div>
        <p class="Dialog-headerTitle"><%= _t('dashboard.views.organization.add_usr_grp') %></p>
        <p class="Dialog-headerText"><%= _t('dashboard.views.organization.share_in_grp') %></p>
      </li>
    </ul>
  </div>
  <div class="CDB-Text js-dlg-body"></div>

  <div class="Dialog-stickyFooter">
    <div class="Dialog-footer ChangePrivacy-shareFooter u-inner">
      <div></div>
      <button class="CDB-Button CDB-Button--primary ok is-disabled">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.organization.add_usr') %></span>
      </button>
    </div>
  </div>
</div>
