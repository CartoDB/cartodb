require_dependency 'carto/configuration'
require_dependency 'carto/deep_freeze'

module Cartodb
  def self.get_config(*config_chain)
    current = Cartodb.config
    config_chain.each { |config_param|
      current = current[config_param]
      if current.nil?
        break
      end
    }
    current if current.present?
  end

  def self.config
    return @config if @config

    begin
      config_file_hash = Carto::Conf.new.app_config
    rescue StandardError => e
      raise "Missing or inaccessible config/app_config.yml: #{e.message}"
    end
    @config ||= config_file_hash[Rails.env].try(:to_options!)
    Carto.deep_freeze(@config)

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
        :address              => Cartodb.get_config(:mailer, 'address'),
        :port                 => Cartodb.get_config(:mailer, 'port'),
        :user_name            => Cartodb.get_config(:mailer, 'user_name'),
        :password             => Cartodb.get_config(:mailer, 'password'),
        :authentication       => Cartodb.get_config(:mailer, 'authentication'),
        :enable_starttls_auto => Cartodb.get_config(:mailer, 'enable_starttls_auto') }
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

    @asset_path = Cartodb.get_config(:app_assets, 'asset_host')
  end

  def self.default_basemap(basemaps = Cartodb.config[:basemaps])
    default_group = default_basemap_group(basemaps)
    (default_group || basemaps.first)[1].first[1]
  end

  # Basemap group based on basemap `default` attribute. If it's not set, first basemap group is returned
  def self.default_basemap_group(basemaps = Cartodb.config[:basemaps])
    default_basemap_group = basemaps.find { |_, group_basemaps| group_basemaps.find { |_, attr| attr['default'] } }
    default_basemap_group || basemaps.first
  end

  # Execute a block with overriden configuration parameters
  # (useful for tests)
  #
  # Example:
  #
  #     Cartodb.with_config http_port: 8080 do
  #        # here Cartodb.get_config(:http_port) is 80
  #     end
  #     # herer Cartodb.get_config(:http_port) has its original value
  #
  # Note that since inner keys are strings (not symbols), you must
  # follow the same conventtion and use:
  #
  #     Cartodb.with_config(ogr2ogr: { 'binary' => 'ogr2ogr' })
  #
  # and not:
  #
  #     Cartodb.with_config(ogr2ogr: { 'binary': 'ogr2ogr' })
  #
  def self.with_config(options)
    original_config = config
    @config = original_config.merge(options)
    return_value = yield
    @config = original_config
    return_value
  end
end
