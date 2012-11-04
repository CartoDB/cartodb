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

  ##
  # Checks that the precompile list contains this file or raises an error, in dev only
  # Note: You will need to move config.assets.precompile to application.rb from production.rb
  def javascript_include_tag *sources
    raise_on_asset_absence sources
    super *sources
  end

  def stylesheet_link_tag *sources
    raise_on_asset_absence sources
    super *sources
  end

  def raise_on_asset_absence *sources
    sources.each do |source|
      CartoDB::Logger.info "SOURCE #{source}"
      next if source == {:media => "all"}
      raise "Hey, #{source} is not in the precompile list. This will fall apart in production." unless Rails.application.config.assets.precompile.any? do |matcher|
        if matcher.is_a? Proc
          matcher.call(source)
        elsif matcher.is_a? Regexp
          matcher.match(source)
        else
          rx = /(\.css)|(\.js)/
          [source].flatten.each do |s|
            matcher.to_s.gsub(rx,'') == s.to_s.gsub(rx,'')
          end
        end
      end
    end if Rails.env.development?
  end

end
