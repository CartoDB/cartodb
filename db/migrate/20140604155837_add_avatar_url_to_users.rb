Sequel.migration do
  up do
    add_column :users, :avatar_url, :text
  end

  down do
    drop_column :users, :avatar_url
  end
end
