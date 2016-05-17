# coding: utf-8

module MobileAppsHelper
  def get_mobile_apps_types
    { "open"    => { text: "Limits based on your CartoDB plan. <a href='#'>Learn more</a>.", available: current_user.open_apps_enabled? },
      "dev"     => { text: "Limited to 5 users, unlimited feature-wise. <a href='#'>Learn more</a>.", available: true },
      "private" => { text: "Only for enterprise. <a href='#'>Learn more</a>.", available: current_user.private_apps_enabled? } }
  end

  def progress_bar_range(used_percentage)
    if used_percentage > 70 && used_percentage < 91
      'is-caution'
    elsif used_percentage > 90
      'is-danger'
    else
      ''
    end
  end
end
