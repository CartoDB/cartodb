module Cartodb
  def self.get_config(*config_chain) 
    current = Cartodb.config
    config_chain.each { |config_param|
      current = current[config_param]
      if current.nil?
        break
      end
    }
    current
  end

  def self.config
    return @config if @config

    begin
    config_file_hash = YAML.load_file("#{Rails.root}/config/app_config.yml")
    rescue => e
      raise "Missing or inaccessible config/app_config.yml: #{e.message}"
    end
    @config ||= config_file_hash[Rails.env].try(:to_options!)

    if @config.blank?
      raise "Can't find App configuration for #{Rails.env} environment on config/app_config.yml"
    end

    # Check if we have all the important keys on config/app_config.yml
    raise "Missing mandatory_keys key on config/app_config.yml" unless @config[:mandatory_keys].present?
    unless(@config[:mandatory_keys].map(&:to_sym) - @config.keys).blank?
      raise "Missing the following config keys on config/app_config.yml: #{(@config[:mandatory_keys].map(&:to_sym) - @config.keys).join(', ')}"
    end
    ActionDispatch::Http::URL.tld_length = @config[:session_domain].split('.').delete_if {|i| i.empty? }.length - 1
   
    if !@config[:mailer].nil?
      # AuthSMTP
      CartoDB::Application.config.action_mailer.delivery_method = :smtp
      CartoDB::Application.config.action_mailer.smtp_settings = { 
        :address              => Cartodb.config[:mailer]['address'],
        :port                 => Cartodb.config[:mailer]['port'],
        :user_name            => Cartodb.config[:mailer]['user_name'],
        :password             => Cartodb.config[:mailer]['password'],
        :authentication       => Cartodb.config[:mailer]['authentication'],
        :enable_starttls_auto => Cartodb.config[:mailer]['enable_starttls_auto'] }
    end

    if !@config[:basemaps].present? || @config[:basemaps].count == 0
      raise "Missing basemaps configuration, there should be at least one basemap"
    end
  end

  def self.error_codes
    return @error_codes if @error_codes
    file_hash = YAML.load_file("#{Rails.root}/config/error_codes.yml")
    @error_codes ||= file_hash["cartodb_errors"].try(:to_options!)
  end    

  def self.asset_path
    return @asset_path if @asset_path
    if Cartodb.config[:app_assets]
      @asset_path = Cartodb.config[:app_assets]['asset_host']
    else
      @asset_path = nil
    end
  end
end
