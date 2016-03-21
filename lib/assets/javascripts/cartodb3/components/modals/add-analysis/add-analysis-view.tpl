<div class="Dialog-header Dialog-header--expanded CreateDialog-header with-separator">
  <ul class="CreateDialog-headerSteps">
    <li class="CreateDialog-headerStep CreateDialog-headerStep--single">
      <div class="Dialog-headerIcon Dialog-headerIcon--neutral">
        <i class="CDB-IconFont CDB-IconFont-map"></i>
      </div>
      <p class="Dialog-headerTitle"><%- _t('components.modals.add-analysis.modal-title') %></p>
      <p class="Dialog-headerText"><%- _t('components.modals.add-analysis.modal-desc') %></p>
    </li>
  </ul>
</div>

<div class="Dialog-body Dialog-body--expanded Dialog-body--create Dialog-body--noPaddingTop Dialog-body--withoutBorder js-body"></div>

<div class="Dialog-footer Dialog-footer--expanded CreateDialog-footer">
  <div>
    <div class="CreateDialog-footerShadow"></div>
    <div class="CreateDialog-footerLine"></div>
    <div class="CreateDialog-footerInner ">
      <div class="CreateDialog-footerInfo"></div>
      <div class="CreateDialog-footerActions">
        <div></div>
        <button class="Button Button--main is-disabled js-add">
          <span><%- _t('components.modals.add-analysis.add-btn') %></span>
        </button>
      </div>
    </div>
  </div>
</div>
