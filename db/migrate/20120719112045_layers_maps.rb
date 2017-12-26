class LayersMapsMigration < Sequel::Migration

  def up
    create_table :layers_maps do
      primary_key :id
      foreign_key :layer_id, :layers
      foreign_key :map_id, :maps
    end
  end

  def down
    drop_table :layers_maps
  end

end
