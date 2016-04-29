require "resolv"

module CartoDB

  begin
    CARTODB_REV = File.read("#{Rails.root}/REVISION").strip
  rescue
    CARTODB_REV = nil
  end

  DEFAULT_DB_SCHEMA = 'public'
  PUBLIC_DB_USER  = 'publicuser'
  PUBLIC_DB_USER_PASSWORD  = 'publicuser'
  TILE_DB_USER    = 'tileuser'
  SRID            = 4326

  SURROGATE_NAMESPACE_VISUALIZATION = 'rv'
  SURROGATE_NAMESPACE_PUBLIC_PAGES = 'rp'
  SURROGATE_NAMESPACE_VIZJSON = 'rj'

  LAST_BLOG_POSTS_FILE_PATH = "#{Rails.root}/public/system/last_blog_posts.html"

  # Helper method to encapsulate Rails full URL generation compatible with our subdomainless mode
  # @param context ActionController::Base or a View or something that holds a request
  # @param path String Rails route name
  # @param params Hash Parameters to send to the url (Optional)
  # @param user ::User (Optional) If not sent will use subdomain or /user/xxx from controller request
  def self.url(context, path, params={}, user = nil)
    if user.nil?
      subdomain = self.extract_subdomain(context.request)
      org_username = nil
    else
      subdomain = user.subdomain
      org_username = user.organization_username
    end
    # Must clean user_domain or else polymorphic_path will use it and generate again /u/xxx/user/xxx
    CartoDB.base_url(subdomain, org_username) + context.polymorphic_path(path, params.merge({user_domain:nil}))
  end

  # Helper method to encapsulate Rails URL path generation compatible with our subdomainless mode
  # @param controller ActionController::Base
  # @param path String Rails route name
  # @param params Hash Parameters to send to the url (Optional)
  def self.path(controller, path, params={})
    controller.polymorphic_path(path, params)
  end

  # "Smart" subdomain extraction from the request, depending on configuration and /u/xxx url fragment
  def self.extract_subdomain(request)
    user_domain = self.username_from_request(request)
    if user_domain.nil?
      if subdomainless_urls? && ip?(request.host)
        ''
      else
        subdomain_from_request(request)
      end
    else
      user_domain
    end
  end

  # Raw subdomain extraction from request
  def self.subdomain_from_request(request)
    self.subdomainless_urls? ? '' : request.host.to_s.gsub(self.session_domain, '')
  end

  # Flexible subdomain extraction: If /u/xxx or /user/xxxx present uses it, else uses request host (xxx.cartodb.com)
  def self.extract_host_subdomain(request)
    self.username_from_request(request).nil? ? nil : self.subdomain_from_request(request)
  end

  # Warning, if subdomains are allowed includes the username as the subdomain,
  #  but else returns a base url WITHOUT '/u/username'
  def self.base_url(subdomain, org_username=nil, protocol_override=nil)
    if self.subdomainless_urls?
      base_url = self.domainless_base_url(subdomain, protocol_override)
    else
      base_url = self.subdomain_based_base_url(subdomain, org_username, protocol_override)
    end

    base_url
  end

  # Note: use ||= only for fields who always have a non-nil, non-false value
  #       else, rely on defined? and pure assignment to allow nils and values caching the value

  # Stores the non-user part of the domain (e.g. '.cartodb.com')
  def self.session_domain
    @@session_domain ||= self.get_session_domain
  end

  def self.domain
    return @@domain if defined?(@@domain)
    @@domain = self.get_domain
  end

  def self.subdomainless_urls?
    return @@subdomainless_urls if defined?(@@subdomainless_urls)
    @@subdomainless_urls = self.get_subdomainless_urls
  end

  def self.account_host
    @@account_host ||= self.get_account_host
  end

  def self.account_path
    @@account_path ||= self.get_account_path
  end

  def self.data_library_path
    @@data_library_path ||= self.get_data_library_path
  end

  def self.request_host=(value)
    @@request_host=value
  end

  def self.protocol(protocol_override=nil)
    default_protocol = self.use_https? ? 'https' : 'http'
    protocol_override.nil? ? default_protocol : protocol_override
  end

  # "private" methods, not intended for direct usage
  # ------------------------------------------------

  def self.request_host
    return @@request_host if defined?(@@request_host)
    @@request_host = ''
  end

  def self.hostname
    @@hostname ||= self.get_hostname
  end

  def self.http_port
    return @@http_port if defined?(@@http_port)
    @@http_port = self.get_http_port
  end

  def self.https_port
    return @@https_port if defined?(@@https_port)
    @@https_port = self.get_https_port
  end

  def self.subdomain_based_base_url(subdomain, org_username=nil, protocol_override=nil)
    protocol = self.protocol(protocol_override)
    base_url ="#{protocol}://#{subdomain}#{self.session_domain}#{protocol == 'http' ? self.http_port : self.https_port}"
    unless org_username.nil?
      base_url << "/u/#{org_username}"
    end
    base_url
  end

  def self.domainless_base_url(subdomain, protocol_override = nil)
    base_domain = domainless_base_domain(protocol_override)
    if !subdomain.nil? && !subdomain.empty?
      "#{base_domain}/user/#{subdomain}"
    else
      base_domain
    end
  end

  def self.domainless_base_domain(protocol_override = nil)
    protocol = self.protocol(protocol_override)
    port = protocol == 'http' ? http_port : https_port
    if ip?(request_host)
      "#{protocol}://#{request_host}#{port}"
    else
      request_subdomain = request_host.sub(session_domain, '')
      request_subdomain += '.' if !request_subdomain.empty? && !request_subdomain.end_with?('.')

      "#{protocol}://#{request_subdomain}#{session_domain}#{port}"
    end
  end

  def self.ip?(string)
    !!(string =~ Resolv::IPv4::Regex)
  end

  def self.username_from_request(request)
    request.params[:user_domain]
  end

  def self.get_hostname
    protocol = self.use_https? ? 'https' : 'http'
    "#{protocol}://#{self.domain}#{self.http_port}"
  end

  def self.get_http_port
    config_port = Cartodb.config[:http_port]
    config_port.nil? || config_port == '' || config_port.to_i == 80 ? '' : ":#{config_port}"
  end

  def self.get_https_port
    config_port = Cartodb.config[:https_port]
    config_port.nil? || config_port == '' || config_port.to_i == 443 ? '' : ":#{config_port}"
  end

  def self.get_domain
    if Rails.env.production? || Rails.env.staging?
      `hostname -f`.strip
    elsif Rails.env.development?
      "vizzuality#{self.session_domain}"
    else
      "test#{self.session_domain}"
    end
  end

  def self.use_https?
    Rails.env.production? || Rails.env.staging?
  end

  def self.get_session_domain
    Cartodb.config[:session_domain]
  end

  def self.get_subdomainless_urls
    Cartodb.config[:subdomainless_urls]
  end

  def self.get_account_host
    Cartodb.config[:account_host]
  end

  def self.get_account_path
    Cartodb.config[:account_path]
  end

  def self.get_data_library_path
    Cartodb.config[:data_library] && Cartodb.config[:data_library]['path']
  end

end
