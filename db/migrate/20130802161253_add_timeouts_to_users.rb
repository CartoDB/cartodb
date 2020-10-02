Sequel.migration do
  change do
    alter_table :users do
      add_column :database_timeout, :integer, default: 300_000
      add_column :user_timeout, :integer, default: 300_000
    end
  end
end
