module ApplicationHelper

  def show_footer?
    (controller_name == 'tables' && action_name != 'show') ||
    (controller_name == 'client_applications') || (controller_name == 'users')
  end

  def in_my_tables?
    controller_name == 'tables' && action_name == 'index' && !params[:public]
  end

  def current_path
    request.path
  end

  def selected_if(condition)
    condition ? 'selected' : ''
  end

  def tag_width(count, min, max)
    if count >= max
      "-100"
    elsif count <= min
      "-250"
    else
      nmax   = max   + min
      mmin   = min   + min
      ncount = count + min
      (250 - ((ncount.to_f * 100.0) / nmax.to_f)/100.to_f * 150).to_s
    end
  end

  def paginate(collection)
    return if collection.empty? || collection.is_a?(Array)
    if collection.page_count > 1
      render(:partial => 'shared/paginate', :locals => {:collection => collection}).html_safe
    end
  end
  
  def headjs_include_tag(*sources)
    sources.unshift("environments/#{Rails.env}.js")
    keys = []
    coder = HTMLEntities.new
    content_tag :script, { :type => Mime::JS }, false do
      "head.js( #{javascript_include_tag(*sources).scan(/src="([^"]+)"/).flatten.map { |src|
        src = coder.decode(src)
        key = URI.parse(src).path[%r{[^/]+\z}].gsub(/\.js$/,'').gsub(/\.min$/,'')
        while keys.include?(key) do
          key += '_' + key
        end
        keys << key
        "{ '#{key}': '#{src}' }"
      }.join(', ')} );".html_safe
    end
  end
  
  def database_time_usage(user_id)
    time = CartoDB::QueriesThreshold.get(user_id, Date.today.strftime("%Y-%m-%d"), "time").to_f
    if time < 120
      number_with_precision(time, :precision => 3)  + ' secs this month'
    elsif time > 120 && time < 60*60
      number_with_precision(time / 60.0, :precision => 3)  + ' minutes this month'
    else
      number_with_precision(time / 3600.0, :precision => 3)  + ' hours this month'
    end
  end
  
  def requests_number_in_the_last_20_days
    result = []
    20.downto(0) do |days|
      date = (Date.today - days.days).strftime("%Y-%m-%d")
      result << CartoDB::QueriesThreshold.get(current_user.id, date)
    end
    result.join(',')
  end
  
  def colors_series_in_the_last_20_days
    result = []
    20.downto(0) do |days|
      date = (Date.today - days.days).strftime("%Y-%m-%d")
      n = CartoDB::QueriesThreshold.get(current_user.id, date).to_i
      result << if n == 0
        "FFFFFF"
      elsif n < 1000
        "D7E6E8"
      elsif n < 5000
        "BFD6D9"
      else
        "9CC0C4"
      end
    end
    result.join('|')
  end
   
end
