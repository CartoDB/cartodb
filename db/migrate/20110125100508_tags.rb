class TagsMigration < Sequel::Migration

  def up
    create_table :tags do
      primary_key :id
      String :name, :null => false
      index :name, :index => true
      Fixnum :count, :null => false, :default => 1
      Fixnum :user_id, :null => false
      Fixnum :table_id, :null => false
    end
  end

  def down
    drop_table :tags
  end

end
