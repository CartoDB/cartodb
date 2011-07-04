namespace :cartodb do
  namespace :db do
    desc <<-DESC
Setup cartodb database and creates a new user from environment variables:
  - ENV['EMAIL']: user e-mail
  - ENV['PASSWORD']: user password
  - ENV['SUBDOMAIN']: user subdomain
DESC
    task :setup => ["rake:db:create", "rake:db:migrate"] do
      begin
        ::Rails::Sequel.connection.run("CREATE USER #{CartoDB::PUBLIC_DB_USER}")
        raise "You should provide a valid e-mail" if ENV['EMAIL'].nil? || ENV['EMAIL'].empty?
        raise "You should provide a valid password" if ENV['PASSWORD'].nil? || ENV['PASSWORD'].empty?
        raise "You should provide a valid subdomain" if ENV['SUBDOMAIN'].nil? || ENV['SUBDOMAIN'].empty?
        u = User.new
        u.email = ENV['EMAIL']
        u.password = ENV['PASSWORD']
        u.password_confirmation = ENV['PASSWORD']
        u.subdomain = ENV['SUBDOMAIN']
        u.username = ENV['SUBDOMAIN']
        u.save
        if u.new?
          raise u.errors.inspect
        end
        u.enable true
        u.setup_user
      rescue
        puts $!
      end
    end
  end
end