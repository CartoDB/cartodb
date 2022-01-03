class UserMetadataExportFactory

  def self.full_export(params = {})
    {
      version: '1.0.19',
      user: {
        email: "e00000002@d00000002.com",
        crypted_password: "0f865d90688f867c18bbd2f4a248537878585e6c",
        database_name: "cartodb_test_user_5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0_db",
        username: "user00000001",
        session_salt: "123456789f",
        state: 'active',
        admin: nil,
        maintenance_mode: true,
        enabled: true,
        invite_token: nil,
        invite_token_date: nil,
        map_enabled: true,
        quota_in_bytes: 5_000_000,
        table_quota: nil,
        public_map_quota: 20,
        public_dataset_quota: 20,
        private_map_quota: 20,
        regular_api_key_quota: 20,
        account_type: "FREE",
        private_tables_enabled: false,
        period_end_date: nil,
        map_views_quota: 10_000,
        max_layers: 8,
        database_timeout: 300_000,
        user_timeout: 300_000,
        database_render_timeout: 0,
        user_render_timeout: 0,
        export_timeout: 0,
        upgraded_at: nil,
        map_view_block_price: nil,
        geocoding_quota: 0,
        dashboard_viewed_at: nil,
        sync_tables_enabled: false,
        database_host: "localhost",
        email_verification_token: "aaa",
        email_veritification_sent_at: Time.zone.now,
        geocoding_block_price: nil,
        api_key: "21ee521b8a107ea55d61fd7b485dd93d54c0b9d2",
        notification: nil,
        organization_id: nil,
        created_at: Time.zone.now,
        updated_at: Time.zone.now,
        disqus_shortname: nil,
        id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0",
        twitter_username: nil,
        website: nil,
        description: nil,
        name: nil,
        avatar_url: "example.com/avatars/avatar_stars_red.png",
        database_schema: "public",
        soft_geocoding_limit: false,
        auth_token: nil,
        twitter_datasource_enabled: nil,
        twitter_datasource_block_price: nil,
        twitter_datasource_block_size: nil,
        twitter_datasource_quota: 0,
        soft_twitter_datasource_limit: false,
        available_for_hire: false,
        private_maps_enabled: false,
        google_sign_in: false,
        last_password_change_date: nil,
        max_import_file_size: 157_286_400,
        max_import_table_row_count: 500_000,
        max_concurrent_import_count: 3,
        last_common_data_update_date: nil,
        google_maps_key: nil,
        google_maps_private_key: nil,
        enable_account_token: nil,
        location: nil,
        here_isolines_quota: 0,
        here_isolines_block_price: nil,
        soft_here_isolines_limit: false,
        mobile_xamarin: false,
        mobile_custom_watermark: false,
        mobile_offline_maps: false,
        mobile_gis_extension: false,
        mobile_max_open_users: 0,
        mobile_max_private_users: 0,
        viewer: false,
        salesforce_datasource_enabled: false,
        builder_enabled: nil,
        geocoder_provider: nil,
        isolines_provider: nil,
        routing_provider: nil,
        github_user_id: nil,
        engine_enabled: true,
        mapzen_routing_quota: nil,
        mapzen_routing_block_price: nil,
        soft_mapzen_routing_limit: false,
        no_map_logo: false,
        org_admin: false,
        last_name: nil,
        feature_flags: [Carto::FeatureFlag.first.name],
        company: 'CARTO',
        phone: '1234567',
        api_keys: [
          {
            created_at: "2018-02-12T16:11:26+00:00",
            db_password: "kkkkkkkkktest_cartodb_user_5f02aa9a-100f-11e8-a8b7-080027eb929e",
            db_role: "test_cartodb_user_5f02aa9a-100f-11e8-a8b7-080027eb929e",
            name: "Master",
            token: "21ee521b8a107ea55d61fd7b485dd93d54c0b9d2",
            type: "master",
            updated_at: "2018-02-12T16:11:26+00:00",
            grants: [{
              type: "apis",
              apis: ["sql", "maps"]
            }, {
              type: 'dataservices',
              services: ['geocoding', 'routing', 'isolines', 'observatory']
            }, {
              type: 'user',
              data: ['profile']
            }],
            user_id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0"
          },
          {
            created_at: "2018-02-12T16:11:26+00:00",
            db_password: "be63855d1179de48dc8c82b9fce338636d961e76",
            db_role: "user00000001_role_31cf62cd1123fe32b0bf76b048e3af39",
            name: "some Api Key",
            token: "OHP1p6jPwG5Lbabr4jq20g",
            type: "regular",
            updated_at: "2018-02-12T16:11:26+00:00",
            grants: [{
              type: "apis",
              apis: []
            }],
            user_id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0"
          },
          {
            id: "2135c786-1ecf-4aff-bcde-e759bb1843e0",
            created_at: "2018-02-12T16:11:26+00:00",
            db_password: "be63855d1179de48dc8c82b9fce338636d961e76",
            db_role: "user00000001_role_31cf62cd112354340bf76b048e3af398",
            name: "oauth_authorization 2135c786-1ecf-4aff-bcde-e759bb1843e0",
            token: "OHP1p6jPwG5Lbabr4jq202",
            type: "oauth",
            updated_at: "2018-02-12T16:11:26+00:00",
            grants: [{
              type: "apis",
              apis: ["sql", "maps"]
            }, {
              type: "user",
              data: ["profile"]
            }, {
              type: "dataservices",
              services: ["routing", "isolines", "observatory", "geocoding"]
            }, {
              type: "database",
              tables: [{
                name: "st",
                permissions: ["select"],
                schema: "test1"
              }]
            }],
            user_id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0"
          }
        ],
        assets: [
          {
            public_url: "https://manolo.es/es/co/bar.png",
            kind: nil,
            storage_info: nil
          }
        ],
        layers: [
          {
            options: {
              "default" => true,
              "url" => "http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
              "subdomains" => "abcd",
              "minZoom" => "0",
              "maxZoom" => "18",
              "attribution" => "© <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> ...",
              "urlTemplate" => "http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
              "type" => "Tiled",
              "name" => "Positron Labels"
            },
            kind: "tiled"
          }
        ],
        rate_limit: {
          id: "44d9db90-e12a-4764-85a4-fee012a98333",
          limits: {
            maps_anonymous: [0, 1, 2],
            maps_static: [0, 1, 2],
            maps_static_named: [0, 1, 2],
            maps_dataview: [0, 1, 2],
            maps_dataview_search: [0, 1, 2],
            maps_analysis: [0, 1, 2],
            maps_tile: [0, 1, 2],
            maps_attributes: [0, 1, 2],
            maps_named_list: [0, 1, 2],
            maps_named_create: [0, 1, 2],
            maps_named_get: [0, 1, 2],
            maps_named: [0, 1, 2],
            maps_named_update: [0, 1, 2],
            maps_named_delete: [0, 1, 2],
            maps_named_tiles: [0, 1, 2],
            maps_analysis_catalog: [0, 1, 2],
            sql_query: [0, 1, 2],
            sql_query_format: [0, 1, 2],
            sql_job_create: [0, 1, 2],
            sql_job_get: [0, 1, 2],
            sql_job_delete: [0, 1, 2],
            sql_copy_from: [0, 1, 2],
            sql_copy_to: [0, 1, 2]
          }
        },
        search_tweets: [
          {
            data_import: {
              data_source: '/path',
              data_type: 'file',
              table_name: 'twitter_cartodb',
              state: 'complete',
              success: true,
              log: {
                type: 'import',
                entries: ''
              },
              updated_at: Time.zone.now,
              created_at: Time.zone.now,
              error_code: nil,
              queue_id: nil,
              tables_created_count: nil,
              table_names: nil,
              append: false,
              migrate_table: nil,
              table_copy: nil,
              from_query: nil,
              id: '118813f4-c943-4583-822e-111ed0b51ca4',
              service_name: 'twitter_search',
              service_item_id: params[:service_item_id],
              stats: '{}',
              type_guessing: true,
              quoted_fields_guessing: true,
              content_guessing: false,
              server: nil,
              host: nil,
              upload_host: nil,
              resque_ppid: nil,
              create_visualization: false,
              visualization_id: nil,
              user_defined_limits: '{}',
              import_extra_options: nil,
              original_url: '',
              privacy: nil,
              cartodbfy_time: 0.0,
              http_response_code: nil,
              rejected_layers: nil,
              runner_warnings: nil,
              collision_strategy: nil,
              external_data_imports: []
            },
            service_item_id: params[:service_item_id],
            retrieved_items: 123,
            state: 'complete',
            created_at: Time.zone.now,
            updated_at: Time.zone.now
          },
          {
            data_import: nil,
            service_item_id: params[:service_item_id],
            retrieved_items: 123,
            state: 'complete',
            created_at: Time.zone.now,
            updated_at: Time.zone.now
          }
        ],
        notifications: {
          builder: {
            onboarding: true,
            "layer-style-onboarding": true,
            "layer-analyses-onboarding": true
          }
        },
        synchronization_oauths: [
          {
            service: 'gdrive',
            token: '1234567890',
            created_at: Time.zone.now,
            updated_at: Time.zone.now
          }
        ],
        db_connections: [
          {
            name: 'Bigquery',
            provider: 'bigquery',
            parameters: {
              billing_project: 'carto-test-bq-project',
              default_project: 'carto-test-bq-project',
              service_account: {
                type: 'service_account',
                project_id: 'carto-test-bq-project',
                private_key_id: 'private-key-id',
                private_key: 'private-key',
                client_email: 'email@cartodb.com',
                client_id: 'client-id',
                auth_uri: 'auth-uri',
                token_uri: 'token-uri',
                auth_provider_x509_cert_url: 'cert-url',
                client_x509_cert_url: 'cert-url',
                email: 'email'
              }.to_json
            }
          }
        ],
        oauth_connections: [
          {
            service: 'gdrive',
            token: '1234567890'
          },
          {
            service: 'bigquery',
            token: '1234567890',
            parameters: {
              billing_project: 'carto-test-bq-project'
            }
          }
        ],
        connector_configurations: [
          {
            created_at: Time.zone.now,
            updated_at: Time.zone.now,
            enabled: true,
            max_rows: 100000,
            provider_name: params[:connector_provider].name
          }
        ],
        client_application: {
          name: 'Dummy Application',
          url: 'http://somewhere.es',
          support_url: 'http://somewhere.es/support',
          callback_url: nil,
          key: "crjNXIU3p8xKcoFMuX5eb10xDwK71BP446ToBRnP",
          secret: "CH3M9gcd9BhLu4ukAg8TPruN0W5zsP4OJ0BQOdtv",
          created_at: "2018-06-08T15:00:45+00:00",
          updated_at: "2018-06-08T15:00:45+00:00",
          oauth_tokens: [{
            token: "oauth_token",
            secret: "oauth_secret",
            callback_url: "http//callback.com",
            verifier: "v1",
            scope: nil,
            authorized_at: "2018-06-11T14:31:46+00:00",
            invalidated_at: "2018-06-11T14:31:46+00:00",
            valid_to: "2018-06-11T14:31:46+00:00",
            created_at: "2018-06-11T14:31:46+00:00",
            updated_at: "2018-06-11T14:31:46+00:00"
          }],
          access_tokens: [{
            token: "access_token",
            secret: "access_secret",
            callback_url: "http://callback2",
            verifier: "v2",
            scope: nil,
            authorized_at: "2018-06-11T14:31:46+00:00",
            invalidated_at: "2018-06-11T14:31:46+00:00",
            valid_to: "2018-06-11T14:31:46+00:00",
            created_at: "2018-06-11T14:31:46+00:00",
            updated_at: "2018-06-11T14:31:46+00:00"
          }]
        },
        user_multifactor_auths: [{
          user_id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0",
          created_at: "2018-11-16T14:31:46+00:00",
          updated_at: "2018-11-17T16:41:56+00:00",
          last_login: "2018-11-17T16:41:56+00:00",
          enabled: true,
          shared_secret: 'abcdefgh',
          type: 'totp'
        }],
        oauth_app_users: [{
          id: "d881e0f1-cf35-4c35-b44a-6dc31608a435", # necessary for role creation
          oauth_app_id: params[:oauth_app].id,
          scopes: ["datasets:r:test1", "datasets:rw:test2"],
          created_at: "2018-11-16T14:31:46+00:00",
          updated_at: "2018-11-17T16:41:56+00:00",
          oauth_authorization_codes: [{
            scopes: ["datasets:r:test1"],
            code: "zzzz",
            redirect_uri: "https://carto.com",
            created_at: "2018-11-16T14:31:46+00:00"
          }],
          oauth_access_tokens: [{
            api_key_id: "2135c786-1ecf-4aff-bcde-e759bb1843e0",
            scopes: [
              "user:profile",
              "dataservices:routing",
              "dataservices:isolines",
              "dataservices:geocoding",
              "datasets:r:test1",
              "schemas:c"
            ],
            created_at: "2018-11-16T14:31:46+00:00"
          }],
          oauth_refresh_tokens: [{
            token: "zzzzz",
            scopes: ["datasets:r:test1", "offline"],
            created_at: "2018-11-16T14:31:46+00:00",
            updated_at: "2018-06-11T14:31:46+00:00"
          }]
        }]
      }
    }
  end

end
