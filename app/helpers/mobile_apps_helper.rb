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

end
