Sequel.migration do
  change do
    alter_table :users do
      add_column :max_layers, :integer, :default => 3
    end
  end
end
