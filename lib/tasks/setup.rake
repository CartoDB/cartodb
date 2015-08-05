namespace :cartodb do
  namespace :test do
    task :prepare do 
      if (ENV['RAILS_ENV'] == "test")
        Rake::Task['db:drop'].invoke &&
        Rake::Task['db:create'].invoke &&
        Rake::Task['db:migrate'].invoke &&
        Rake::Task['cartodb:db:create_publicuser'].invoke
      else
        system("rake cartodb:test:prepare RAILS_ENV=test") || raise("Something went wrong")
      end
    end
  end
  namespace :db do
    desc <<-DESC
Setup cartodb database and creates a new user from environment variables:
  - ENV['EMAIL']: user e-mail
  - ENV['PASSWORD']: user password
  - ENV['SUBDOMAIN']: user subdomain
DESC
    task :setup => ["rake:db:create", "rake:db:migrate", "cartodb:db:create_publicuser"] do
      raise "You should provide a valid e-mail"    if ENV['EMAIL'].blank?
      raise "You should provide a valid password"  if ENV['PASSWORD'].blank?
      raise "You should provide a valid subdomain" if ENV['SUBDOMAIN'].blank?

      # Reload User model schema to avoid errors
      # when running this task along with db:migrate
      User.set_dataset :users
      
      u = User.new
      u.email = ENV['EMAIL']
      u.password = ENV['PASSWORD']
      u.password_confirmation = ENV['PASSWORD']
      u.username = ENV['SUBDOMAIN']
      u.database_host = ENV['DATABASE_HOST'] || ::Rails::Sequel.configuration.environment_for(Rails.env)['host']
      u.save

      raise u.errors.inspect if u.new?
      puts "User #{u.username} created successfully"
    end

    task :create_dev_user => 
      ["rake:db:create", "rake:db:migrate", "cartodb:db:create_publicuser"] do
      raise "You should provide a valid e-mail"    if ENV['EMAIL'].blank?
      raise "You should provide a valid password"  if ENV['PASSWORD'].blank?
      raise "You should provide a valid subdomain" if ENV['SUBDOMAIN'].blank?

      # Reload User model schema to avoid errors
      # when running this task along with db:migrate
      User.set_dataset :users
      
      u = User.new
      u.email = ENV['EMAIL']
      u.password = ENV['PASSWORD']
      u.password_confirmation = ENV['PASSWORD']
      u.username = ENV['SUBDOMAIN']
      u.database_host = ENV['DATABASE_HOST'] || ::Rails::Sequel.configuration.environment_for(Rails.env)['host']
      u.save

      raise u.errors.inspect if u.new?
      puts "User #{u.username} created successfully"
      
      # 10 Gb of quota
      quota = 1073741824
      u.update(:quota_in_bytes => quota)
      
      u.rebuild_quota_trigger
      puts "User: #{u.username} quota updated to: 10 GB. #{u.tables.count} tables updated."

      u.update(:table_quota => nil)             
      puts "User: #{u.username} table quota updated to: unlimited"
      
      u.update(:private_tables_enabled => true)      
      puts "User: #{u.username} private tables enabled: true"
     
      u.update(:account_type => '[DEDICATED]')       
      puts "User: #{u.username} table account type updated to: [DEDICATED]"
    end

    desc "make public and tile users"
    task :create_publicuser => :environment do
      [CartoDB::PUBLIC_DB_USER, CartoDB::TILE_DB_USER].each do |u|
        puts "Creating user #{u}"
        ::Rails::Sequel.connection.run("DO $$
        BEGIN
          IF NOT EXISTS ( SELECT * FROM pg_user WHERE usename = '#{u}') THEN 
            CREATE USER #{u}; -- TODO: with password '...'
          ELSE
            RAISE NOTICE 'User #{u} already exists';
          END IF;
          RETURN;
        END;
        $$ LANGUAGE 'plpgsql';")
      end
    end

    # TODO: remove text bit and just use env
    desc "Create a plain user account"
    task :create_user => :environment do
      begin
        raise "You should provide a valid e-mail"    if ENV['EMAIL'].blank?
        raise "You should provide a valid password"  if ENV['PASSWORD'].blank?
        raise "You should provide a valid subdomain" if ENV['SUBDOMAIN'].blank?

        u = User.new
        u.email = ENV['EMAIL']
        u.password = ENV['PASSWORD']
        u.password_confirmation = ENV['PASSWORD']
        u.username = ENV['SUBDOMAIN']
        if ENV['DATABASE_HOST'].blank?
          u.database_host = ::Rails::Sequel.configuration.environment_for(Rails.env)['host']
        else
          u.database_host = ENV['DATABASE_HOST']
        end
        u.save
        if u.new?
          raise u.errors.inspect
        end
        puts "USER_ID #{u.id}"
      rescue => e
        puts e.inspect
      end
    end

    desc "Set the password of the user in the USER_NAME environment variable to the value of the USER_PASSWORD environment variable"
    task :change_user_password => :environment do
      raise "Set USER_NAME environment variable" if ENV['USER_NAME'].blank?
      raise "Set USER_PASSWORD environment variable" if ENV['USER_PASSWORD'].blank?
      password = ENV['USER_PASSWORD']

      users = User.filter(:username => ENV['USER_NAME']).all
      if users.empty?
        raise "User doesn't exist"
      else
        u = users.first
        u.password = password
        u.password_confirmation = password
        if !u.save
          rais u.errors.inspect
        else
          puts "Password changed"
        end
      end
    end
  end
end
