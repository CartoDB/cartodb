Sequel.migration do
  up do
    alter_table :data_imports do
      add_column :http_response_code, :text
    end
  end

  down do
    alter_table :data_imports do
      drop_column :http_response_code
    end
  end
end
