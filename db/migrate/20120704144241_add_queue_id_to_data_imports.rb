class AddQueueIdToDataImportsMigration < Sequel::Migration

  def up
    add_column :data_imports, :queue_id, String
  end

  def down
    drop_column :data_imports, :queue_id
  end

end
