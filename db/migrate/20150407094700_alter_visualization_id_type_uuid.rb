# INFO: needed at editor_backend_refactor branch, merged before master validation
Sequel.migration do

  up do
    SequelRails.connection.run(%Q{ ALTER TABLE external_sources drop constraint if exists external_sources_visualization_id_fkey; })

    begin
      SequelRails.connection.run(%Q{ ALTER TABLE external_sources ALTER COLUMN visualization_id TYPE uuid USING (visualization_id::uuid); })
      SequelRails.connection.run(%Q{ ALTER TABLE visualizations ALTER COLUMN id TYPE uuid USING (id::uuid); })
    rescue => e
      puts "There was an error converting visualizations.id (or external_sources.visualization.id) from type text to uuid, please check id format: #{e.inspect}"
      puts "You can find non-matching ids with this query: `select id from visualizations where id not similar to '[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}';`"
      raise e
    end

    alter_table(:external_sources) do
      add_foreign_key [:visualization_id], :visualizations
    end
  end

  down do
    SequelRails.connection.run(%Q{ ALTER TABLE external_sources drop constraint if exists external_sources_visualization_id_fkey; })

    SequelRails.connection.run(%Q{ ALTER TABLE visualizations ALTER COLUMN id TYPE text USING (id::text); })
    SequelRails.connection.run(%Q{ ALTER TABLE external_sources ALTER COLUMN visualization_id TYPE text USING (visualization_id::text); })

    alter_table(:external_sources) do
      add_foreign_key [:visualization_id], :visualizations
    end
  end

end
