Sequel.migration do
  up do
    alter_table :data_imports do
      add_column :runner_warnings, :text
    end
  end

  down do
    alter_table :data_imports do
      drop_column :runner_warnings
    end
  end
end
