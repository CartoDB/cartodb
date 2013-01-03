Sequel.migration do
  up do
    #require Rails.root.join('lib/cartodb/migrator20')

    #Migrator20.new.migrate!
  end

  down do
    #Table.select(:id, :database_name, :name, :user_id).all.each do |table|
    #  $tables_metadata.hset(table.key, 'migrated_to_20', false)
    #end
  end
end
