namespace :cartodb do
  namespace :db do
    desc <<-DESC
Setup cartodb database and creates a new user from environment variables:
  - ENV['email']: user e-mail
  - ENV['password']: user password
  - ENV['subdomain']: user subdomain
DESC
    task :setup => ["rake:db:create", "rake:db:migrate"] do
      begin
        ::Rails::Sequel.connection.run("CREATE USER #{CartoDB::PUBLIC_DB_USER}")
        raise "You should provide a valid e-mail" if ENV['email'].nil? || ENV['email'].empty?
        raise "You should provide a valid password" if ENV['password'].nil? || ENV['password'].empty?
        raise "You should provide a valid subdomain" if ENV['subdomain'].nil? || ENV['subdomain'].empty?
        u = User.new
        u.email = ENV['email']
        u.password = ENV['password']
        u.password_confirmation = ENV['password']
        u.subdomain = ENV['subdomain']
        u.username = ENV['subdomain']
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