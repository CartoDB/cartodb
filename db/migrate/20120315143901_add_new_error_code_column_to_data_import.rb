class AddNewErrorCodeColumnToDataImportMigration < Sequel::Migration

  def up
    create_table :data_imports do
      primary_key :id
    end
  end

  def down
    drop_table :data_imports
  end

end
