Sequel.migration do
  up do
    alter_table :maps do
      add_column :embed_options,
                 :string,
                 type: 'json',
                 null: false,
                 default: '{}'
    end
  end

  down do
    alter_table :maps do
      drop_column :embed_options
    end
  end
end
