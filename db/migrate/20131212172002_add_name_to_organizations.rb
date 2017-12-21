Sequel.migration do
  up do
    add_column :organizations, :name, String
  end

  down do
    drop_column :organizations, :name
  end
end
