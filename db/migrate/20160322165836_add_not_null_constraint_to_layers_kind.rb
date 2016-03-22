Sequel.migration do
  up do
    Rails::Sequel.connection.run(%{ UPDATE layers SET kind = 'carto' WHERE kind IS NULL; })

    alter_table :layers do
      set_column_not_null(:kind)
    end
  end

  down do
    alter_table :layers do
      set_column_allow_null(:kind)
    end
  end
end
