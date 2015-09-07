Sequel.migration do
  up do
    alter_table :users do
      add_column :job_role, :text
      add_column :industry, :text
    end
  end

  down do
    alter_table :users do
      drop_column :job_role
      drop_column :industry
    end
  end

end
