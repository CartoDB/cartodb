class ChangeDataImportTimestampDefaultMigration < Sequel::Migration

  def up
    alter_table(:data_imports) do
      set_column_default :created_at, Sequel::CURRENT_TIMESTAMP
    end
  end

  def down
  end

end
