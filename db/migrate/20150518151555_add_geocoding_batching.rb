class AddBatchedToGeocoding < Sequel::Migration

  def up
    alter_table :geocodings do
      add_column :batched, :boolean
    end
  end

  def down
    alter_table :geocodings do
      drop_column :batched
    end
  end
end
