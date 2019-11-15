Sequel.migration do
  change do
    alter_table :visualizations do
      add_column :active_layer_id, Integer
    end
  end
end

