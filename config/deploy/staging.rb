role :app, appserver_staging
role :web, appserver_staging
role :db,  appserver_staging, :primary => true

set :branch, "staging"

task :set_staging_flag, :roles => [:app] do
  run <<-CMD
    cd #{release_path} &&
    touch STAGING
  CMD
end