# encoding: utf-8

namespace :cartodb do

  namespace :users do
    desc 'Get map views from remote service for every user'
    task :update_remote_map_views => :environment do
      puts "Updating local map views cache for every user..."
      User.all.each do |u|
        print "  - Update #{u.username}"
        u.set_old_api_calls # updates map views stats older than 3 hours
        print " OK\n"
      end
    end # task :update_remote_map_views
  end # namespace :user

end # namespace :cartodb
