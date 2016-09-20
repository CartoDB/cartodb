module Carto::Configuration
  def db_config_file
    if ENV['RAILS_DATABASE_FILE']
      db_config = YAML.load(File.read(File.join(Rails.root, 'config/' + ENV['RAILS_DATABASE_FILE'])))
    else
      db_config = YAML.load(File.read(File.join(Rails.root, 'config/database.yml')))
    end
  end
end

# TODO: singleton
class Carto::Conf
  include Carto::Configuration
end
