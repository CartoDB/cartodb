Sequel.migration do
  up do
    add_column :organizations, :geocoding_block_price, :integer
    add_column :organizations, :map_view_block_price, :integer
  end

  down do
    remove_column :organizations, :geocoding_block_price
    remove_column :organizations, :map_view_block_price
  end
end
