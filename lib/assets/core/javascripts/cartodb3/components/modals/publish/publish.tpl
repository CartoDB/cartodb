<div class="Publish-modalHeader">
  <div class="u-inner">
    <div class="CDB-Text CDB-Size-huge is-light u-ellipsis u-bSpace--m"><%- name %></div>
    <ul class="u-flex u-alignCenter">
      <li class="js-dropdown u-rSpace--xl"></li>
      <% if (hasShareStats) { %>
      <li class="js-share-users">
      </li>
      <% } %>
      <li class="CDB-Text CDB-Size-medium u-altTextColor js-update">
      </li>
    </ul>
  </div>
</div>

<div class="Publish-modalBody js-panes
<% if (isSimple) { %>is-simple<% } %>
">
  <% if (isSimple) { %>
    <div class="Publish-modalShadow"></div>
  <% } %>

</div>

<div class="Dialog-footer Dialog-footer--expanded CreateDialog-footer Publish-modalFooter">
  <div>
    <div class="CreateDialog-footerShadow"></div>
    <div class="CreateDialog-footerLine"></div>
    <div class="CreateDialog-footerInner ">
      <div class="CreateDialog-footerInfo"></div>
      <div class="CreateDialog-footerActions js-footerActions u-flex u-justifySpace u-grow">
        <div class="js-upgrade"></div>
        <button class="CDB-Button CDB-Button--secondary js-done">
          <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.publish.done-btn') %></span>
        </button>
      </div>
    </div>
  </div>
</div>
