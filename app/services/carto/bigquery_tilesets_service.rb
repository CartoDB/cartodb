require 'google/apis/bigquery_v2'
require 'date'
require 'json'

module Carto
  class BigqueryTilesetsService

    MAX_DATASETS = 500
    TILESET_LABEL = 'carto_tileset'.freeze
    SCOPES = %w(https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/bigquery).freeze
    MAPS_API_V2_US_SERVICE_ACCOUNT = 'serviceAccount:maps-api-v2@avid-wavelet-844.iam.gserviceaccount.com'.freeze
    MAPS_API_V2_EU_SERVICE_ACCOUNT = 'serviceAccount:maps-api-v2@cdb-gcp-europe.iam.gserviceaccount.com'.freeze
    MAPS_API_V2_READ_ACCESS = 'roles/bigquery.dataViewer'.freeze
    TILESET_PRIVACY_PUBLIC = 'public'.freeze
    TILESET_PRIVACY_PRIVATE = 'private'.freeze

    def initialize(user:, connection_id:, project_id:)
      conn = user.db_connections.where(id: connection_id, connector: 'bigquery').first
      raise Carto::LoadError, 'Missing bigquery connector' unless conn

      @connection_id = connection_id
      @project_id = project_id
      @service_account = conn.parameters['service_account']
      @billing_project_id = conn.parameters['billing_project']

      @bigquery_api = Google::Apis::BigqueryV2::BigqueryService.new
      @bigquery_api.authorization = Google::Auth::ServiceAccountCredentials.make_creds(
        json_key_io: StringIO.new(@service_account), scope: SCOPES
      )
    end

    def list_datasets
      datasets = @bigquery_api.list_datasets(@project_id, max_results: MAX_DATASETS).datasets
      return [] unless datasets

      datasets.map do |dataset|
        { id: dataset.dataset_reference.dataset_id, location: dataset.location }
      end
    end

    def list_tilesets(dataset_id:, **pagination)
      query = Google::Apis::BigqueryV2::QueryRequest.new
      query.query = tileset_metadata_script(
        dataset_id: dataset_id,
        order: pagination[:order],
        direction: pagination[:direction],
        page: pagination[:page],
        per_page: pagination[:per_page],
        offset: pagination[:offset]
      )
      query.use_legacy_sql = false
      query.use_query_cache = true
      resp = @bigquery_api.query_job(@project_id, query)
      return [] unless resp.rows

      resp.rows.map do |row|
        id = row.f[0].v
        metadata = JSON.parse(row.f[1].v)
        { id: id, created_at: metadata['created_at'], updated_at: metadata['updated_at'], metadata: metadata }
      end
    end

    def count_tilesets(dataset_id)
      query = Google::Apis::BigqueryV2::QueryRequest.new
      query.query = count_tilesets_list(dataset_id)
      query.use_legacy_sql = false
      query.use_query_cache = true
      resp = @bigquery_api.query_job(@project_id, query)
      resp.rows[0].f[0].v.to_i
    end

    def tileset(tileset_id)
      project_id, dataset_id, table_id = tileset_id.split('.')
      resource = "projects/#{project_id}/datasets/#{dataset_id}/tables/#{table_id}"
      iam_policy = @bigquery_api.get_table_iam_policy(resource)

      public = false
      if !iam_policy.bindings.nil? && iam_policy.bindings.is_a?(Array)
        iam_policy.bindings.map do |binding|
          next unless maps_api_v2_has_read_access(binding)

          public = true
        end
      end

      metadata = tileset_metadata(tileset_id)
      service_account = JSON.parse(@service_account)

      {
        id: tileset_id,
        owner: service_account['client_email'],
        privacy: public ? TILESET_PRIVACY_PUBLIC : TILESET_PRIVACY_PRIVATE,
        created_at: metadata['created_at'],
        updated_at: metadata['updated_at'],
        metadata: metadata
      }
    end

    def publish(dataset_id:, tileset_id:)
      members = [MAPS_API_V2_US_SERVICE_ACCOUNT, MAPS_API_V2_EU_SERVICE_ACCOUNT]
      set_tileset_iam_policy(dataset_id: dataset_id, tileset_id: tileset_id, members: members)
    end

    def unpublish(dataset_id:, tileset_id:)
      members = []
      set_tileset_iam_policy(dataset_id: dataset_id, tileset_id: tileset_id, members: members)
    end

    private

    def tileset_metadata_script(dataset_id:, **pagination)
      %{
        DECLARE tilesets ARRAY<STRING>;
        DECLARE i INT64 DEFAULT 0;
        DECLARE tileset STRING DEFAULT '';
        DECLARE query STRING default '';
        DECLARE metadata_query STRING default '';

        SET tilesets = (
          SELECT ARRAY_AGG(id) FROM (#{tileset_list_query(dataset_id)})
        );

        LOOP
          SET i = i + 1;
          IF i > ARRAY_LENGTH(tilesets) THEN
            LEAVE;
          END IF;
          SET tileset = tilesets[ORDINAL(i)];
          SET query = """(
            SELECT
              '""" || tileset || """' as id,
              CAST(data AS STRING) AS metadata
            FROM
              `""" || tileset || """`
            WHERE
              carto_partition IS NULL AND z = -1 LIMIT 1
          )""";
          IF i = 1 THEN
            SET metadata_query = query;
          ELSE
            SET metadata_query = CONCAT(metadata_query, ' UNION ALL ', query);
          END IF;
        END LOOP;

        EXECUTE IMMEDIATE """
          SELECT *
          FROM (""" || metadata_query || """)
          ORDER BY #{pagination[:order]} #{pagination[:direction]}
          LIMIT #{pagination[:per_page]} OFFSET #{pagination[:offset]}
        """;
      }.squish
    end

    def count_tilesets_list(dataset_id)
      "SELECT COUNT(*) FROM (#{tileset_list_query(dataset_id)})".squish
    end

    def tileset_list_query(dataset_id)
      %{
        SELECT
          FORMAT('%s.%s.%s', tables.table_catalog, tables.table_schema, tables.table_name) as id
        FROM
          `#{@project_id}.#{dataset_id}.INFORMATION_SCHEMA.TABLES` as tables
        JOIN
          `#{@project_id}.#{dataset_id}.INFORMATION_SCHEMA.TABLE_OPTIONS` as table_options
        ON
          tables.table_catalog = table_options.table_catalog
        AND
          tables.table_schema = table_options.table_schema
        AND
          tables.table_name = table_options.table_name
        WHERE
          option_name = 'labels'
        AND
          option_value LIKE '%carto_tileset%'
      }.squish
    end

    def tileset_metadata(tileset_id)
      query = Google::Apis::BigqueryV2::QueryRequest.new
      query.query = tileset_metadata_query(tileset_id)
      query.use_legacy_sql = false
      query.use_query_cache = true
      resp = @bigquery_api.query_job(@project_id, query)
      JSON.parse(resp.rows[0].f[0].v)
    end

    def tileset_metadata_query(tileset_id)
      %{
        SELECT
          CAST(data AS STRING) AS metadata
        FROM
          `#{tileset_id}`
        WHERE
          carto_partition IS NULL
        AND
          z = -1
        LIMIT 1
      }.squish
    end

    def maps_api_v2_has_read_access(binding)
      binding.role == MAPS_API_V2_READ_ACCESS &&
        (binding.members.include?(MAPS_API_V2_US_SERVICE_ACCOUNT) ||
          binding.members.include?(MAPS_API_V2_EU_SERVICE_ACCOUNT))
    end

    def set_tileset_iam_policy(dataset_id:, tileset_id:, members:)
      resource = "projects/#{@project_id}/datasets/#{dataset_id}/tables/#{tileset_id}"

      binding = Google::Apis::BigqueryV2::Binding.new
      binding.members = members
      binding.role = MAPS_API_V2_READ_ACCESS

      policy = Google::Apis::BigqueryV2::Policy.new
      policy.bindings = [binding]

      iam_policy_request = Google::Apis::BigqueryV2::SetIamPolicyRequest.new
      iam_policy_request.policy = policy

      @bigquery_api.set_table_iam_policy(resource, iam_policy_request)
    end

  end
end
