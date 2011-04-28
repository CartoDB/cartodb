raw_config = YAML.load_file("#{Rails.root}/config/app_config.yml")[Rails.env]
APP_CONFIG = raw_config.to_options! unless raw_config.nil?

raw_errors = YAML.load_file("#{Rails.root}/config/error_codes.yml")["cartodb_errors"]
ERROR_CODES = raw_errors.to_options! unless raw_errors.nil?
