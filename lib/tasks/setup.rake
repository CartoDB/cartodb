namespace :cartodb do
  namespace :db do
    desc <<-DESC
Setup cartodb database and creates a new user from environment variables:
  - ENV['EMAIL']: user e-mail
  - ENV['PASSWORD']: user password
  - ENV['SUBDOMAIN']: user subdomain
DESC
    task :setup => ["rake:db:create", "rake:db:migrate", "cartodb:db:create_publicuser", "cartodb:db:create_admin"] do
      begin
        raise "You should provide a valid e-mail" if ENV['EMAIL'].nil? || ENV['EMAIL'].empty?
        raise "You should provide a valid password" if ENV['PASSWORD'].nil? || ENV['PASSWORD'].empty?
        raise "You should provide a valid subdomain" if ENV['SUBDOMAIN'].nil? || ENV['SUBDOMAIN'].empty?
        u = User.new
        u.email = ENV['EMAIL']
        u.password = ENV['PASSWORD']
        u.password_confirmation = ENV['PASSWORD']
        u.username = ENV['SUBDOMAIN']
        u.save
        if u.new?
          raise u.errors.inspect
        end
      rescue
        puts $!
      end
    end
    
    desc "make public and tile users"
    task :create_publicuser => :environment do
      begin
        ::Rails::Sequel.connection.run("CREATE USER #{CartoDB::PUBLIC_DB_USER}")
      rescue
      end
      begin
        ::Rails::Sequel.connection.run("CREATE USER #{CartoDB::TILE_DB_USER}")
      rescue
      end  
    end
    
    desc "Create an admin account with a default user password unless ADMIN_PASSWORD environment variable is set"
    task :create_admin => :environment do
      password = ENV['ADMIN_PASSWORD'] || "SS6vhd0u6q9MJx3d"
      
      u = User.new
      u.email = "admin@cartodb.com"
      u.password = password
      u.password_confirmation = password
      u.username = "admin"
      u.enabled = true
      u.admin = true
      u.save
      if u.new?
        raise u.errors.inspect
      end
    end
    
    desc "Sets the password of the admin user to the value of a PASSWORD environment variable"
    task :change_admin_password => :environment do
      if ENV['PASSWORD'].blank?
        puts "You must set a value for the PASSWORD environment variable"
        exit 1
      end
      u = User.filter(:username => "admin").first
      u.password = ENV['PASSWORD']
      u.password_confirmation = ENV['PASSWORD']
      if !u.save
        raise u.errors.inspect
      end
    end
  end
end