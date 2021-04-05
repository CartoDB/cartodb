require 'signet/oauth_2/client'
require 'google/apis/bigquery_v2'
require 'date'
require 'json'

module Carto
  class BigqueryTilesetsService

    MAX_DATASETS = 500
    TILESET_LABEL = 'carto_tileset'.freeze
    SCOPES = %w(https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/bigquery).freeze
    MAPS_API_V2_STAGING_SERVICE_ACCOUNTS = [
      'serviceAccount:maps-api-v2@cartodb-on-gcp-staging.iam.gserviceaccount.com'
    ].freeze
    MAPS_API_V2_PRODUCTION_SERVICE_ACCOUNTS = [
      'serviceAccount:maps-api-v2@avid-wavelet-844.iam.gserviceaccount.com',
      'serviceAccount:maps-api-v2@cdb-gcp-europe.iam.gserviceaccount.com'
    ].freeze
    MAPS_API_V2_READ_ACCESS = 'roles/bigquery.dataViewer'.freeze
    TILESET_PRIVACY_PUBLIC = 'public'.freeze
    TILESET_PRIVACY_PRIVATE = 'private'.freeze

    def initialize(user:, connection_id:, project_id:)
      conn = user.connections.find_by(id: connection_id)
      raise Carto::LoadError, 'Missing BigQuery connection' unless conn
      raise Carto::LOadError, 'Invalid BigQuery connection' unless conn.connector == 'bigquery' && conn.complete?

      @connection_id = connection_id
      @project_id = project_id
      @billing_project_id = conn.parameters['billing_project']
      @bigquery_api = Google::Apis::BigqueryV2::BigqueryService.new
      if conn.connection_type == Carto::Connection::TYPE_DB_CONNECTOR
        service_account = conn.parameters['service_account']
        @bigquery_api.authorization = Google::Auth::ServiceAccountCredentials.make_creds(
          json_key_io: StringIO.new(service_account), scope: SCOPES
        )
        @owner = service_account['client_email']
      else
        refresh_token = conn.token
        oauth_config = Cartodb.get_config(:oauth, 'bigquery')
        @bigquery_api.authorization = Signet::OAuth2::Client.new(
          authorization_uri: oauth_config['authorization_uri'],
          token_credential_uri:  oauth_config['token_credential_uri'],
          client_id: oauth_config['client_id'],
          client_secret: oauth_config['client_secret'],
          scope: SCOPES,
          refresh_token: refresh_token
        )
        @owner = user.email
      end
    end

    def list_datasets
      datasets = @bigquery_api.list_datasets(@project_id, max_results: MAX_DATASETS).datasets
      return [] unless datasets

      datasets.map do |dataset|
        { id: dataset.dataset_reference.dataset_id, location: dataset.location }
      end
    rescue Google::Apis::AuthorizationError => e
      raise Carto::UnauthorizedError.new(e.message, e.status_code)
    rescue Google::Apis::ClientError => e
      raise Carto::BadRequest.new(e.message, e.status_code)
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
      resp = @bigquery_api.query_job(@billing_project_id, query)
      return [] unless resp.rows

      resp.rows.map do |row|
        id = row.f[0].v
        metadata = JSON.parse(row.f[1].v)
        { id: id, created_at: metadata['created_at'], updated_at: metadata['updated_at'], metadata: metadata }
      end
    rescue Google::Apis::AuthorizationError => e
      raise Carto::UnauthorizedError.new(e.message, e.status_code)
    rescue Google::Apis::ClientError => e
      raise Carto::BadRequest.new(e.message, e.status_code)
    end

    def count_tilesets(dataset_id)
      query = Google::Apis::BigqueryV2::QueryRequest.new
      query.query = count_tilesets_list(dataset_id)
      query.use_legacy_sql = false
      query.use_query_cache = true
      resp = @bigquery_api.query_job(@billing_project_id, query)
      resp.rows[0].f[0].v.to_i
    rescue Google::Apis::AuthorizationError => e
      raise Carto::UnauthorizedError.new(e.message, e.status_code)
    rescue Google::Apis::ClientError => e
      raise Carto::BadRequest.new(e.message, e.status_code)
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
      {
        id: tileset_id,
        owner: @owner,
        privacy: public ? TILESET_PRIVACY_PUBLIC : TILESET_PRIVACY_PRIVATE,
        created_at: metadata['created_at'],
        updated_at: metadata['updated_at'],
        metadata: metadata
      }
    rescue Google::Apis::AuthorizationError => e
      raise Carto::UnauthorizedError.new(e.message, e.status_code)
    rescue Google::Apis::ClientError => e
      raise Carto::BadRequest.new(e.message, e.status_code)
    end

    def publish(dataset_id:, tileset_id:)
      set_tileset_iam_policy(dataset_id: dataset_id, tileset_id: tileset_id, members: maps_api_v2_service_accounts)
    rescue Google::Apis::AuthorizationError => e
      raise Carto::UnauthorizedError.new(e.message, e.status_code)
    rescue Google::Apis::ClientError => e
      raise Carto::BadRequest.new(e.message, e.status_code)
    end

    def unpublish(dataset_id:, tileset_id:)
      members = []
      set_tileset_iam_policy(dataset_id: dataset_id, tileset_id: tileset_id, members: members)
    rescue Google::Apis::AuthorizationError => e
      raise Carto::UnauthorizedError.new(e.message, e.status_code)
    rescue Google::Apis::ClientError => e
      raise Carto::BadRequest.new(e.message, e.status_code)
    end

    private

    def tileset_metadata_script(dataset_id:, **pagination)
      empty_metadata_query = %{
        SELECT CAST(NULL AS STRING) AS id, CAST(NULL AS STRING) AS metadata LIMIT 0
      }
      %{
        DECLARE tilesets ARRAY<STRING>;
        DECLARE i INT64 DEFAULT 0;
        DECLARE tileset STRING DEFAULT '';
        DECLARE query STRING default '';
        DECLARE metadata_query STRING default '#{empty_metadata_query}';

        SET tilesets = (
          SELECT
            ARRAY_AGG(id)
          FROM (
            SELECT *
            FROM (#{tileset_list_query(dataset_id)})
            ORDER BY #{pagination[:order]} #{pagination[:direction]}
            LIMIT #{pagination[:per_page]} OFFSET #{pagination[:offset]}
          )
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

        EXECUTE IMMEDIATE
          "SELECT * FROM (" || metadata_query || ") ORDER BY #{pagination[:order]} #{pagination[:direction]}";
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
      resp = @bigquery_api.query_job(@billing_project_id, query)
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
      if Rails.env.production?
        us_sa, eu_sa = MAPS_API_V2_PRODUCTION_SERVICE_ACCOUNTS
        binding.role == MAPS_API_V2_READ_ACCESS && (binding.members.include?(us_sa) || binding.members.include?(eu_sa))
      else
        staging_sa, = MAPS_API_V2_STAGING_SERVICE_ACCOUNTS
        binding.role == MAPS_API_V2_READ_ACCESS && binding.members.include?(staging_sa)
      end
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

    def maps_api_v2_service_accounts
      if Rails.env.production?
        MAPS_API_V2_PRODUCTION_SERVICE_ACCOUNTS
      else
        MAPS_API_V2_STAGING_SERVICE_ACCOUNTS
      end
    end

  end
end
