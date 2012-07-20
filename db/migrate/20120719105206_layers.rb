class LayersMigration < Sequel::Migration

  def up
    create_table :layers do
      primary_key :id
      String :options, :text => true
      String :kind, :text => true
    end
  end

  def down
    drop_table :layers
  end

end
