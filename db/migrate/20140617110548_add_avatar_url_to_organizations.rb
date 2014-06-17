Sequel.migration do
  up do
    add_column :organizations, :avatar_url, :text
  end

  down do
    drop_column :organizations, :avatar_url
  end
end
