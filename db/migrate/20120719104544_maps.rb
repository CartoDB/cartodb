class MapsMigration < Sequel::Migration

  def up
    create_table :maps do
      primary_key :id
      Integer :user_id, :null => false, :index => true
    end
  end

  def down
    drop_table :maps
  end

end
