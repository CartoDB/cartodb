Sequel.migration do
  change do
    alter_table :user_tables do
      add_column :description, :text
    end
  end
end
