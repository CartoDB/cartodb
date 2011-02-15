class UserTablesMigration < Sequel::Migration

  def up
    create_table :user_tables do
      primary_key :id
      Integer :user_id, :null => false, :index => true
      String :name, :null => false
      Integer :privacy, :null => false
      DateTime :updated_at, :null => false
      String :tags, :text => true
      String :geometry_columns
      Integer :rows_counted
      Integer :rows_estimated
    end

    alter_table(:user_tables) do
      add_index [:user_id, :privacy]
      add_index [:name, :user_id], :unique => true
      set_column_default :privacy, 0
      set_column_default :rows_counted, 0
      set_column_default :rows_estimated, 0
    end
  end

  def down
    drop_table :user_tables
  end

end
