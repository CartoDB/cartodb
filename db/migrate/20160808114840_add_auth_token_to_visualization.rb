Sequel.migration do
  change do
    alter_table :visualizations do
      add_column :auth_token, :text
    end
  end
end
