Sequel.migration do
  up do
    alter_table :data_imports do
      add_column :original_url, :text, default: ''
    end
  end

  down do
    alter_table :data_imports do
      drop_column :original_url
    end
  end
end
