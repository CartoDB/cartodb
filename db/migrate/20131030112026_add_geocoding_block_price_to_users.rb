Sequel.migration do
  up do
    alter_table :users do
      add_column :geocoding_block_price, :integer
    end
  end

  down do
    alter_table :users do
      drop_column :geocoding_block_price
    end
  end
end
