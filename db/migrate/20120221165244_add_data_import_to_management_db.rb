class AddDataImportToManagamentDbMigration < Sequel::Migration

  def up
    create_table :data_imports do
      primary_key :id
      Integer :user_id, :null=>false
      Integer :table_id
      String :data_source, :text=>true
      String :data_type, :text=>true
      String :table_name, :text=>true
      String :state, :text=>true, :null=>false
      Boolean :success, :null=>false
      Text :logger, :text=>true, :null=>false
      DateTime :updated_at, :null=>false
      DateTime :created_at
    end
    alter_table(:data_imports) do
      add_index [:user_id, :table_id], :unique => true
      add_index [:user_id]
      add_index [:table_id]
      add_index [:state]
      set_column_default :logger, "Begin:\n"
      set_column_default :success, false
      set_column_default :created_at, Time.now
    end
  end

  def down
    drop_table :data_imports
  end

end
