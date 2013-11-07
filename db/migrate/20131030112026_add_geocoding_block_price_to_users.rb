Sequel.migration do
  change do
    alter_table :users do
      add_column :geocoding_block_price, :integer
    end
  end
end
