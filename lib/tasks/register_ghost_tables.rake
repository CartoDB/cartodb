# encoding: utf-8
namespace :cartodb do

  namespace :db do

    desc 'Link one ghost table to the user dashboard, does not remove the original table'
    task :register_ghost_table, [:username, :table_name] => :environment do |t, args|
      usage = "usage: rake cartodb:db:register_ghost_table[username,table_name]"
      raise usage if args[:username].blank? || args[:table_name].blank?

      raise 'Deprecated'

      begin
        user       = User.find(username: args[:username] )
        table_name = args[:table_name]

        table                          = Table.new
        table.user_id                  = user.id
        table.migrate_existing_table   = table_name
        table.keep_user_database_table = true # just in case
        table.save

        puts "------ #{table.name} registered for user #{user.username}"
      rescue => e
        puts "------ Error registering #{table_name} for user #{args[:username]}"
        raise e
      end
    end # task :register_ghost_table

  end # namespace :db

end # namespace :cartodb
