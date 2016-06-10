# coding: utf-8

module MobileAppsHelper
  def progress_bar_range(used_percentage)
    if used_percentage > 70 && used_percentage < 91
      'is-caution'
    elsif used_percentage > 90
      'is-danger'
    else
      ''
    end
  rescue
    ''
  end

  def progress_bar_width
    case @mobile_app.app_type
    when 'dev'
      (@mobile_app.monthly_users * 100) / @max_dev_users
    when 'open'
      (@mobile_app.monthly_users * 100) / progress_bar_max_users
    when 'private'
      (@mobile_app.monthly_users * 100) / progress_bar_max_users
    else
      0
    end
  rescue
    0
  end

  def progress_bar_max_users
    case @mobile_app.app_type
    when 'dev'
      @max_dev_users
    when 'open'
      current_user.mobile_max_open_users
    when 'private'
      current_user.mobile_max_private_users
    else
      0
    end
  rescue
    0
  end
end
