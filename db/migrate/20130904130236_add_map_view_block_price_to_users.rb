Sequel.migration do
  change do
    alter_table :users do
      add_column :map_view_block_price, :integer
    end
  end
end
