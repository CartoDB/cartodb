Sequel.migration do
  up do
    add_column :data_imports, :content_guessing,           :boolean, null: false, default: false
  end

  down do
    drop_column :data_imports, :content_guessing
  end
end
