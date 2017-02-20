class TagsMigration < Sequel::Migration

  def up
    create_table :tags do
      primary_key :id
      String :name, :null => false
      Integer :user_id, :null => false, :index => true
      Integer :table_id, :null => false, :index => true
      index [:user_id, :table_id, :name], :unique => true
    end
  end

  def down
    drop_table :tags
  end

end
