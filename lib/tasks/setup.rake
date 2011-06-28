namespace :cartodb do
  namespace :db do
    desc "Setup cartodb database"
    task :setup => "rake:db:create" do
      begin
        ::Rails::Sequel.connection.run("CREATE USER #{CartoDB::PUBLIC_DB_USER}")
      rescue
        puts $!
      end
    end
  end
end