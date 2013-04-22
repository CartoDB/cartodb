::Sequel::DATABASES.each{|d| d.sql_log_level = CartoDB::Application.config.log_level }
