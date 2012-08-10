module Cartodb
  def self.config
    return @config if @config
    config_file_hash = YAML.load_file("#{Rails.root}/config/app_config.yml")
    @config ||= config_file_hash[Rails.env].try(:to_options!)

    if @config.blank?
      raise "Can't find App configuration for #{Rails.env} environment on app_config.yml"
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
