Sequel.migration do
  up do
    alter_table :maps do
      add_column :options,
                 :string,
                 type: 'json'
    end
  end

  down do
    alter_table :maps do
      drop_column :options
    end
  end
end
