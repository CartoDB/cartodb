namespace :cartodb do
  desc 'Update all table schemas'
  task :update_table_schemas => :environment do
    Table.all.each do |table|
      user = User[table.user_id]
      table.database_name = user.database_name
      table.save_changes
      table.update_stored_schema!
    end
  end
end