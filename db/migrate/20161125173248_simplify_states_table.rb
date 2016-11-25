Sequel.migration do
  up do
    alter_table :states do
      drop_index [:visualization_id, :user_id]
      drop_column :user_id
      drop_column :visualization_id
    end
  end

  down do
    alter_table :states do
      foreign_key :user_id,
                  :users,
                  type: :uuid,
                  null: false,
                  on_delete: :cascade

      foreign_key :visualization_id,
                  :visualizations,
                  type: :uuid,
                  null: false,
                  on_delete: :cascade

      add_index [:visualization_id, :user_id]
    end
  end
end
