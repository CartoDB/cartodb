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

end
