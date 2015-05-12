::Sequel::DATABASES.each{|d| d.sql_log_level = :debug }

@dbconfig = YAML.load(File.read(File.join(Rails.root, 'config/database.yml')))
# INFO: our current database.yml sets Sequel PostgreSQL adapter, which is called 'postgres'. Rails' is 'postgresql'
@dbconfig[Rails.env]['adapter'] = 'postgresql'
