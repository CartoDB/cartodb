# coding: utf-8

module ApplicationHelper

  def current_user
    super(request.subdomain)
  end

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
      rangeUnit = 130 / (max)
      -100 - (count * rangeUnit)
    end
  end

  def paginate(collection)
    return if collection.empty?
    if collection.is_a?(Hash)
      if collection[:page_count] > 1
        render(:partial => 'shared/paginate', :locals => {:collection => collection}).html_safe
      end
    else
      if collection.page_count > 1
        render(:partial => 'shared/paginate', :locals => {:collection => collection}).html_safe
      end
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


  def disk_usage_class(usage)
    result = ''
    result << if usage < 74
      "fine"
    elsif usage >= 74 && usage < 95
      "be_careful"
    else
      "boom"
    end
  end

  # capped percent indicator
  def disk_usage_percent(usage, quota)
    return 100 if usage > quota
    (usage / quota) * 100
  end


  def last_blog_posts
    # Data generated from Rake task in lib/tasks/blog.rake
    if File.file?(CartoDB::LAST_BLOG_POSTS_FILE_PATH)
      File.read(CartoDB::LAST_BLOG_POSTS_FILE_PATH).html_safe
    end
  end

  def account_url
    if Cartodb.config[:account_host]
      request.protocol + CartoDB.account_host + CartoDB.account_path + '/' + current_user.username
    end
  end

  def upgrade_url
    account_url + '/upgrade'
  end

  def frontend_config
    {
      tiler_protocol:     Cartodb.config[:tile_protocol],
      tiler_port:         Cartodb.config[:tile_port],
      tiler_domain:       Cartodb.config[:tile_host],
      sql_api_protocol:   Cartodb.config[:sql_api_protocol],
      sql_api_domain:     "#{request.subdomain}.#{Cartodb.config[:sql_api_domain]}",
      sql_api_endpoint:   Cartodb.config[:sql_api_endpoint],
      sql_api_port:       Cartodb.config[:sql_api_port],
      cartodb_com_hosted: Cartodb.config[:cartodb_com_hosted],
      account_host:       Cartodb.config[:account_host]
    }.to_json
  end

  def stringified_member_type
    current_user.present? ? current_user.account_type.to_s.upcase : 'UNAUTHENTICATED'
  end

  # Checks that the precompile list contains this file or raises an error, in dev only
  # Note: You will need to move config.assets.precompile to application.rb from production.rb
  def javascript_include_tag *sources
    sources.each do |source|
      raise "Hey, #{source} is not in the precompile list. This will fall apart in production." unless Rails.application.config.assets.precompile.any? do |matcher|
        if matcher.is_a? Proc
          matcher.call(source)
        elsif matcher.is_a? Regexp
          matcher.match(source)
        else
          matcher.to_s.gsub(/\.js/,'') == source.to_s.gsub(/\.js/,'')
        end
      end
    end if Rails.env.development?
    super *sources
  end

  def stylesheet_link_tag *sources
    sources.each do |source|
      raise "Hey, #{source} is not in the precompile list. This will fall apart in production." unless Rails.application.config.assets.precompile.any? do |matcher|
        if matcher.is_a? Proc
          matcher.call(source)
        elsif matcher.is_a? Regexp
          matcher.match(source)
        else
          matcher.to_s.gsub(/\.css/,'') == source.to_s.gsub(/\.css/,'')
        end
      end
    end if Rails.env.development?
    super *sources
  end

end
