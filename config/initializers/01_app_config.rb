raw_config = YAML.load_file("#{Rails.root}/config/app_config.yml")[Rails.env]
APP_CONFIG = raw_config.to_options! unless raw_config.nil?
