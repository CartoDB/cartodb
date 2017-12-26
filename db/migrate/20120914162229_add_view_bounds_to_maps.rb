Sequel.migration do
  change do
    alter_table :maps do
      add_column :view_bounds_sw, :text
      add_column :view_bounds_ne, :text
    end
  end
end
