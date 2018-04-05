<div class="CDB-Text Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative">
    <i class="CDB-IconFont CDB-IconFont-trash"></i>
    <% if (numOfIcons > 0) { %>
    <span class="Badge Badge--negative Dialog-headerIconBadge CDB-Text CDB-Size-small"><%- numOfIcons %></span>
    <% } %>
  </div>
  <h4 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m u-tSpace-xl">
    You are deleting
    <% if (numOfIcons <= 0) { %>
      icons
    <% } else if (numOfIcons === 1) { %>
      1 icon
    <% } else { %>
      <%- numOfIcons  %> icons
    <% } %>
    from your organization.
  </h4>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    Once icons are deleted they cannot be recovered. Any maps within the organization that use
    <% if (numOfIcons === 1) { %>
      this icon
    <% } else { %>
      these icons
    <% } %>
    will be adversely affected.
  </p>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">Please be sure before proceeding.</p>
</div>

<div class="Dialog-footer Dialog-footer--simple u-inner">
  <div class="Dialog-footerContent">
    <button class="CDB-Button CDB-Button--secondary js-cancel">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Cancel</span>
    </button>
    <button class="u-lSpace--xl CDB-Button CDB-Button--error js-submit">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Ok, delete</span>
    </button>
  </div>
</div>
