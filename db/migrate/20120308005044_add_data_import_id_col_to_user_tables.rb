class AddDataImportIdColToUserTablesMigration < Sequel::Migration

  def up
    add_column :user_tables, :data_import_id, :bigint
  end

  def down
    drop_column :user_tables, :data_import_id
  end

end
