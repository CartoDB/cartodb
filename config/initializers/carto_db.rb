module CartoDB

  # "Smart" subdomain extraction from the request, depending on configuration and /u/xxx url fragment
  # Param enforced by app/controllers/application_controller -> ensure_user_domain_param (before_filter)
  def self.extract_subdomain(request)
    user_domain = self.username_from_request(request)
    user_domain.nil? ? self.subdomain_from_request(request) : user_domain
  end

  # Raw subdomain extraction from request
  def self.subdomain_from_request(request)
    request.host.to_s.gsub(self.session_domain, '')
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

  # NOTE: Not intended for usage outside testing (where is needed to clean state between tests)
  def self.clear_internal_cache
    remove_class_variable(:@@hostname) if defined?(@@hostname)
    remove_class_variable(:@@http_port) if defined?(@@http_port)
    remove_class_variable(:@@https_port) if defined?(@@http_ports)
    remove_class_variable(:@@session_domain) if defined?(@@session_domain)
    remove_class_variable(:@@domain) if defined?(@@domain)
    remove_class_variable(:@@subdomainless_urls) if defined?(@@subdomainless_urls)
    remove_class_variable(:@@subdomains_allowed) if defined?(@@subdomains_allowed)
    remove_class_variable(:@@subdomains_optional) if defined?(@@subdomains_optional)
    remove_class_variable(:@@account_host) if defined?(@@account_host)
    remove_class_variable(:@@account_path) if defined?(@@account_path)
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

  # If true, we allow both 'user.cartodb.com' and 'org.cartodb.com/u/user'
  # if false, only cartodb.com/u/user is allowed (and organizations won't work)
  def self.subdomains_allowed?
    return @@subdomains_allowed if defined?(@@subdomains_allowed)
    @@subdomains_allowed = self.get_subdomains_allowed
  end

  def self.subdomains_optional?
    return @@subdomains_optional if defined?(@@subdomains_optional)
    @@subdomains_optional = self.get_subdomains_optional
  end

  def self.account_host
    @@account_host ||= self.get_account_host
  end

  def self.account_path
    @@account_path ||= self.get_account_path
  end

  begin
    CARTODB_REV = File.read("#{Rails.root}/REVISION").strip
  rescue
    CARTODB_REV = nil
  end

  PUBLIC_DB_USER  = 'publicuser'
  PUBLIC_DB_USER_PASSWORD  = 'publicuser'
  TILE_DB_USER    = 'tileuser'
  SRID            = 4326

  # @see services/importer/lib/importer/column.rb -> RESERVED_WORDS
  # @see app/models/table.rb -> RESERVED_COLUMN_NAMES
  POSTGRESQL_RESERVED_WORDS = %W{ ALL ANALYSE ANALYZE AND ANY ARRAY AS ASC ASYMMETRIC AUTHORIZATION BETWEEN BINARY BOTH CASE CAST
                                  CHECK COLLATE COLUMN CONSTRAINT CREATE CROSS CURRENT_DATE CURRENT_ROLE CURRENT_TIME CURRENT_TIMESTAMP
                                  CURRENT_USER DEFAULT DEFERRABLE DESC DISTINCT DO ELSE END EXCEPT FALSE FOR FOREIGN FREEZE FROM FULL
                                  GRANT GROUP HAVING ILIKE IN INITIALLY INNER INTERSECT INTO IS ISNULL JOIN LEADING LEFT LIKE LIMIT LOCALTIME
                                  LOCALTIMESTAMP NATURAL NEW NOT NOTNULL NULL OFF OFFSET OLD ON ONLY OR ORDER OUTER OVERLAPS PLACING PRIMARY
                                  REFERENCES RIGHT SELECT SESSION_USER SIMILAR SOME SYMMETRIC TABLE THEN TO TRAILING TRUE UNION UNIQUE USER
                                  USING VERBOSE WHEN WHERE XMIN XMAX }

  RESERVED_COLUMN_NAMES = %W{ FORMAT CONTROLLER ACTION oid tableoid xmin cmin xmax cmax ctid ogc_fid }

  LAST_BLOG_POSTS_FILE_PATH = "#{Rails.root}/public/system/last_blog_posts.html"


  # "private" methods, not intended for direct usage
  # ------------------------------------------------

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

  def self.protocol(protocol_override=nil)
    default_protocol = self.use_https? ? 'https' : 'http'
    protocol_override.nil? ? default_protocol : protocol_override
  end

  def self.subdomain_based_base_url(subdomain, org_username=nil, protocol_override=nil)
    protocol = self.protocol(protocol_override)
    base_url ="#{protocol}://#{subdomain}#{self.session_domain}#{protocol == 'http' ? self.http_port : self.https_port}"
    unless org_username.nil?
      base_url << "/u/#{org_username}"
    end
    base_url
  end

  def self.domainless_base_url(subdomain, protocol_override=nil)
    protocol = self.protocol(protocol_override)
    "#{protocol}://#{self.session_domain}#{protocol == 'http' ? self.http_port : self.https_port}/user/#{subdomain}"
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

  def self.get_subdomains_allowed
    Cartodb.config[:subdomains_allowed]
  end

  def self.get_subdomains_optional
    Cartodb.config[:subdomains_optional]
  end

  def self.get_account_host
    Cartodb.config[:account_host]
  end

  def self.get_account_path
    Cartodb.config[:account_path]
  end

end

