role :app, linode_staging
role :web, linode_staging
role :db,  linode_staging, :primary => true

set :branch, "staging"

task :set_staging_flag, :roles => [:app] do
  run <<-CMD
    cd #{release_path} &&
    touch STAGING
  CMD
end