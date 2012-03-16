class AddNewErrorCodeColumnToDataImportMigration < Sequel::Migration

  def up
    add_column :data_imports, :error_code, :integer
  end

  def down
    drop_column :data_imports, :error_code  
  end

end
