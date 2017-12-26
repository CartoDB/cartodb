class LayersUsersMigration < Sequel::Migration

  def up
    create_table :layers_users do
      primary_key :id
      foreign_key :layer_id, :layers
      foreign_key :user_id, :users
    end
  end

  def down
    drop_table :layers_users
  end

end
