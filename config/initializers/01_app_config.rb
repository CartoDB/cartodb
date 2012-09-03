module Cartodb
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

    unless @config[:mandatory_keys].present? && (@config[:mandatory_keys].map(&:to_sym) - @config.keys).blank?
      raise "Missing the following config keys on config/app_config.yml: #{(@config[:mandatory_keys].map(&:to_sym) - @config.keys).join(', ')}"
    end
  end

  def self.error_codes
    return @error_codes if @error_codes
    file_hash = YAML.load_file("#{Rails.root}/config/error_codes.yml")
    @error_codes ||= file_hash["cartodb_errors"].try(:to_options!)
  end    
end

#raw_config = YAML.load_file("#{Rails.root}/config/app_config.yml")[Rails.env]
#APP_CONFIG = raw_config.to_options! unless raw_config.nil?

#raw_errors = YAML.load_file("#{Rails.root}/config/error_codes.yml")["cartodb_errors"]
#Cartodb.error_codes = raw_errors.to_options! unless raw_errors.nil?
