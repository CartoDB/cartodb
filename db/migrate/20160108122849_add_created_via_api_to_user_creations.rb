Sequel.migration do
  up do
    add_column :user_creations, :created_via_api, :boolean
  end

  down do
    drop_column :user_creations, :created_via_api
  end
end
