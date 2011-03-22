namespace :cartodb do
  desc 'Update all table schemas'
  task :update_table_schemas => :environment do
    Table.all.each do |table|
      table.update_stored_schema!
    end
  end
end