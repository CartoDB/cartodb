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
  end

  def progres_bar_width
    if @mobile_app.app_type == 'dev'
      (@mobile_app.monthly_users * 100) / @max_dev_users
    elsif @mobile_app.app_type == 'open'
      (@mobile_app.monthly_users * 100) / progress_bar_max_users
    elsif @mobile_app.app_type == 'private'
      (@mobile_app.monthly_users * 100) / progress_bar_max_users
    end
  end

  def progress_bar_max_users
    if @mobile_app.app_type == 'dev'
      @max_dev_users
    elsif @mobile_app.app_type == 'open'
      current_user.mobile_max_open_users
    elsif @mobile_app.app_type == 'private'
      current_user.mobile_max_private_users
    end
  end
end
