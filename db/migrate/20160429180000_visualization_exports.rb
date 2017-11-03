Sequel.migration do
  up do
    create_table :visualization_exports do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      String :visualization_id, type: 'uuid', null: false
      String :user_id, type: 'uuid', null: false
      String :user_tables_ids, text: true
      String :state, text: true, null: false, default: 'pending'
      String :file, text: true
      String :url, text: true
      String :log_id, type: 'uuid', null: true
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end

    # Note: add "NOT VALID" at the end of each FK if validation takes long.
    SequelRails.connection.run(%{
      ALTER TABLE visualization_exports
        ADD CONSTRAINT visualization_exports_visualization_id_fkey FOREIGN KEY (visualization_id)
          REFERENCES visualizations (id) ON DELETE CASCADE NOT VALID;
    })
    SequelRails.connection.run(%{
      ALTER TABLE visualization_exports
        ADD CONSTRAINT visualization_exports_user_id_fkey FOREIGN KEY (user_id)
          REFERENCES users (id) ON DELETE CASCADE;
    })
    SequelRails.connection.run(%{
      ALTER TABLE visualization_exports
        ADD CONSTRAINT visualization_exports_log_id_fkey FOREIGN KEY (log_id)
          REFERENCES logs (id) ON DELETE CASCADE;
    })
  end

  down do
    drop_table :visualization_exports
  end
end
