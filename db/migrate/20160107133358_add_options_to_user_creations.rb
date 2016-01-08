Sequel.migration do
  up do
    add_column :user_creations, :options, :text
  end

  down do
    drop_column :user_creations, :options
  end
end
