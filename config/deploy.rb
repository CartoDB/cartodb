require 'capistrano/ext/multistage'

set :stages, %w(staging production)
set :default_stage, "production"

require "bundler/capistrano"

default_run_options[:pty] = true

set :application, 'cartodb'

set :scm, :git
# set :git_enable_submodules, 1
set :git_shallow_clone, 1
set :scm_user, 'ubuntu'
set :use_sudo, false
set :repository, "git@github.com:Vizzuality/cartodb.git"
ssh_options[:forward_agent] = true
ssh_options[:keys] = [File.join(ENV["HOME"], ".ec2", "id-vizzuality")]
set :keep_releases, 5

set :appserver_staging, '184.73.254.217'
set :appserver_production, '184.73.254.217'
set :user,  'ubuntu'

set(:deploy_to){
  "/home/ubuntu/www/#{stage}.#{application}.com"
}

after  "deploy:update_code", :symlinks, :run_migrations, :set_staging_flag, :get_last_blog_posts

desc "Restart Application"
deploy.task :restart, :roles => [:app] do
  run "touch #{current_path}/tmp/restart.txt"
end

desc "Migraciones"
task :run_migrations, :roles => [:app] do
  run <<-CMD
    export RAILS_ENV=#{stage} &&
    cd #{release_path} &&
    rake db:migrate --trace
  CMD
end

task :symlinks, :roles => [:app] do
  run <<-CMD
    ln -s #{shared_path}/system #{release_path}/public/system;
    ln -s #{shared_path}/pdfs #{release_path}/public/;
    ln -s #{shared_path}/cache #{release_path}/public/;
    ln -s #{shared_path}/uploads #{release_path}/public/;
    ln -nfs #{shared_path}/config/database.yml #{release_path}/config/database.yml;
    ln -nfs #{shared_path}/config/app_config.yml #{release_path}/config/app_config.yml;
  CMD
end

desc 'Create asset packages'
task :asset_packages, :roles => [:app] do
 run <<-CMD
   export RAILS_ENV=#{stage} &&
   cd #{release_path} &&
   rake asset:packager:build_all
 CMD
end

desc "Uploads config yml files to app server's shared config folder"
task :upload_yml_files, :roles => :app do
  run "mkdir #{deploy_to}/shared/config ; true"
  upload("config/database.yml", "#{deploy_to}/shared/config/database.yml")
  upload("config/app_config.yml", "#{deploy_to}/shared/config/app_config.yml")
end

desc "Run last blog posts"
task :get_last_blog_posts, :roles => [:app] do
  run <<-CMD
    export RAILS_ENV=#{stage} &&
    cd #{release_path} &&
    rake cartodb:blog:get_last_posts
  CMD
end


namespace :db do
  desc "Run rake:seed on remote app server"
  task :seed, :roles => :app do
    run "cd #{current_release} && RAILS_ENV=#{stage} rake db:seed"
  end

  desc "Setup the database"
  task :setup, :roles => :app do
    run "cd #{current_release} && RAILS_ENV=#{stage} rake db:setup"
  end

  desc "Resets the database"
  task :reset, :roles => :app do
    run "cd #{current_release} && RAILS_ENV=#{stage} rake db:reset"
  end
end