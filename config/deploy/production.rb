role :app, appserver_production
role :web, appserver_production
role :db,  appserver_production, :primary => true

set :branch, "production"

task :set_staging_flag, :roles => [:app] do
end