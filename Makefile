REV=$(shell git rev-parse HEAD)
RUBY_MAJOR=$(shell ruby -e "puts RUBY_VERSION" | cut -d. -f1)

all:
	RAILS_ENV=test bundle install
	# I cannot remmeber why gdal is being skipped from this list...
	cat python_requirements.txt | grep -v gdal | sudo pip install -r /dev/stdin
	npm install

WORKING_SPECS_INTEGRATIONS = \
	$(NULL)

WORKING_SPECS_1 = \
	spec/models/table_spec.rb \
	spec/models/table_privacy_manager_spec.rb \
	spec/models/table/column_typecaster_spec.rb \
	spec/models/user_spec.rb \
	spec/models/user_presenter_spec.rb \
	spec/models/user_table_spec.rb \
	spec/models/layer_spec.rb \
	spec/models/layer/presenter_spec.rb \
	spec/requests/application_controller_spec.rb \
	spec/requests/sessions_spec.rb \
	spec/requests/api/json/layer_presenter_spec.rb \
	spec/requests/carto/api/layer_presenter_spec.rb \
	spec/requests/carto/api/data_import_presenter_spec.rb \
	spec/requests/carto/api/database_groups_controller_spec.rb \
	spec/requests/carto/api/groups_controller_spec.rb \
	spec/requests/carto/api/grantables_controller_spec.rb \
	spec/requests/carto/api/infowindow_migrator_spec.rb \
	spec/requests/carto/api/layer_presenter_spec.rb \
	spec/requests/carto/api/overlay_presenter_spec.rb \
	spec/requests/carto/api/presenter_cache_spec.rb \
	spec/requests/carto/api/templates_controller_spec.rb \
	spec/requests/carto/api/user_creations_controller_spec.rb \
	spec/requests/carto/api/widgets_controller_spec.rb \
	spec/requests/carto/builder/public/embeds_controller_spec.rb \
	spec/requests/carto/builder/visualizations_controller_spec.rb \
	spec/requests/visualizations_controller_helper_spec.rb \
	spec/requests/warden_spec.rb \
	spec/models/map_spec.rb \
	spec/models/map/copier_spec.rb \
	spec/models/visualization/collection_spec.rb \
	spec/models/visualization/locator_spec.rb \
	spec/models/visualization/member_spec.rb \
	spec/models/visualization/name_checker_spec.rb \
	spec/models/visualization/name_generator_spec.rb \
	spec/models/visualization/organization_visualization_spec.rb \
	spec/models/visualization/overlays_spec.rb \
	spec/models/visualization/presenter_spec.rb \
	spec/models/visualization/relator_spec.rb \
	spec/models/visualization/table_blender_spec.rb \
	spec/models/visualization/tags_spec.rb \
	spec/models/data_import_spec.rb \
	spec/models/geocoding_spec.rb \
	spec/models/common_data_spec.rb \
	spec/lib/api_calls_spec.rb \
	spec/lib/errors_spec.rb \
	spec/lib/url_signer_spec.rb \
	spec/lib/string_spec.rb \
	spec/lib/image_metadata_spec.rb \
	spec/lib/central_spec.rb \
	spec/lib/trending_maps_spec.rb \
	spec/lib/explore_api_spec.rb \
	spec/lib/user_account_creator_spec.rb \
	spec/lib/carto/filename_generator_spec.rb \
	spec/lib/carto/http_header_authentication_spec.rb \
	spec/lib/carto/saml_service_spec.rb \
	spec/lib/carto/users_metadata_redis_cache_spec.rb \
	spec/lib/carto/visualization_migrator_spec.rb \
	spec/lib/carto/http/client_spec.rb \
	spec/lib/carto/table_utils_spec.rb \
	spec/helpers/uuidhelper_spec.rb \
	spec/helpers/url_validator_spec.rb \
	spec/models/carto/data_import_spec.rb \
	spec/models/carto/visualization_spec.rb \
	spec/models/carto/visualization/watcher_spec.rb \
	spec/models/carto/map_spec.rb \
	spec/models/carto/template_spec.rb \
	spec/models/carto/group_spec.rb \
	spec/models/carto/widget_spec.rb \
	spec/models/carto/ldap/configuration_spec.rb \
	spec/services/carto/data_library_service_spec.rb \
	spec/services/carto/user_authenticator_spec.rb \
	spec/requests/sessions_controller_spec.rb \
	spec/services/carto/visualizations_export_service_spec.rb \
	spec/services/carto/visualizations_export_service_2_spec.rb \
	$(NULL)

WORKING_SPECS_2 = \
	spec/lib/cartodb/stats/importer_spec.rb \
	spec/lib/cartodb/stats/platform_spec.rb \
	spec/lib/cartodb/connection_pool_spec.rb \
	services/importer/spec/acceptance/geojson_spec.rb \
	services/importer/spec/acceptance/gpx_spec.rb \
	services/importer/spec/acceptance/kml_spec.rb \
	services/importer/spec/acceptance/mapinfo_spec.rb \
	services/importer/spec/acceptance/osm_spec.rb \
	services/importer/spec/acceptance/sql_spec.rb \
	services/importer/spec/acceptance/raster2pgsql_spec.rb \
	services/importer/spec/acceptance/csv_spec.rb \
	services/importer/spec/acceptance/gz_tgz_spec.rb \
	services/importer/spec/acceptance/zip_spec.rb \
	services/importer/spec/acceptance/shp_spec.rb \
	services/importer/spec/acceptance/rar_spec.rb \
	services/importer/spec/unit/column_spec.rb \
	services/importer/spec/unit/csv_normalizer_spec.rb \
	services/importer/spec/unit/shp_normalizer_spec.rb \
	services/importer/spec/unit/shp_helper_spec.rb \
	services/importer/spec/unit/excel2csv_spec.rb \
	services/importer/spec/unit/downloader_spec.rb \
	services/importer/spec/unit/georeferencer_spec.rb \
	services/importer/spec/unit/json2csv_spec.rb \
	services/importer/spec/unit/kml_splitter_spec.rb \
	services/importer/spec/unit/gpx_splitter_spec.rb \
	services/importer/spec/unit/loader_spec.rb \
	services/importer/spec/unit/mail_notifier_spec.rb \
	services/importer/spec/unit/sql_loader_spec.rb \
	services/importer/spec/unit/table_sampler_spec.rb \
	services/importer/spec/unit/ogr2ogr_spec.rb \
	services/importer/spec/unit/post_import_handler_spec.rb \
	services/importer/spec/unit/runner_spec.rb \
	services/importer/spec/unit/unp_spec.rb \
	services/importer/spec/unit/url_translator/fusion_tables_spec.rb \
	services/importer/spec/unit/url_translator/github_spec.rb \
	services/importer/spec/unit/url_translator/google_docs_spec.rb \
	services/importer/spec/unit/url_translator/google_maps_spec.rb \
	services/importer/spec/unit/url_translator/osm_spec.rb \
	services/importer/spec/unit/url_translator/osm2_spec.rb \
	services/importer/spec/unit/source_file_spec.rb \
	services/importer/spec/unit/content_guesser_spec.rb \
	services/importer/spec/unit/namedplaces_guesser_spec.rb \
	services/importer/spec/unit/connector_spec.rb \
	services/importer/spec/unit/connector_runner_spec.rb \
	$(NULL)

WORKING_SPECS_4 = \
	services/wms/spec/unit/wms_spec.rb \
	services/sql-api/spec/sql_api_spec.rb \
	spec/requests/admin/organizations_controller_spec.rb \
	spec/requests/admin/visualizations_spec.rb \
	spec/requests/carto/api/visualizations_controller_spec.rb \
	spec/requests/carto/api/tables_controller_spec.rb \
	spec/queries/carto/visualization_query_builder_spec.rb \
	spec/requests/admin/tables_spec.rb \
	spec/requests/admin/pages_controller_spec.rb \
	spec/requests/carto/api/organizations_controller_spec.rb \
	spec/requests/carto/api/organization_users_controller_spec.rb \
	spec/requests/carto/api/multifactor_authentication_controller_spec.rb \
	spec/requests/api/imports_spec.rb \
	spec/requests/api/json/imports_controller_spec.rb \
	spec/requests/carto/api/imports_controller_spec.rb \
	spec/connectors/importer_spec.rb \
	spec/connectors/importer_overviews_spec.rb \
	spec/requests/carto/api/connectors_controller_spec.rb \
	spec/requests/api/geocodings_spec.rb \
	$(NULL)

WORKING_SPECS_5 = \
	spec/requests/api/assets_spec.rb \
	spec/requests/carto/api/assets_controller_spec.rb \
	spec/requests/carto/api/layers_controller_spec.rb \
	spec/requests/carto/api/records_controller_spec.rb \
	spec/requests/carto/api/columns_controller_spec.rb \
	spec/requests/api/synchronizations_spec.rb \
	spec/requests/api/json/synchronizations_controller_spec.rb \
	spec/requests/carto/api/synchronizations_controller_spec.rb \
	services/geocoder/spec/geocoder_spec.rb \
	services/table-geocoder/spec/table_geocoder_spec.rb \
	services/table-geocoder/spec/internal-geocoder/input_type_resolver_spec.rb \
	services/table-geocoder/spec/internal-geocoder/query_generator_factory_spec.rb \
	services/table-geocoder/spec/lib/gme/table_geocoder_spec.rb \
	spec/models/synchronization/member_spec.rb \
	spec/models/synchronization/member_overviews_spec.rb \
	spec/models/synchronization/collection_spec.rb \
	spec/models/organization_spec.rb \
	spec/models/user_organization_spec.rb \
	spec/models/synchronization/synchronization_oauth_spec.rb \
	spec/models/permission_spec.rb \
	spec/models/carto/permission_spec.rb \
	spec/lib/carto/ghost_tables_manager_spec.rb \
	spec/lib/carto/bolt_spec.rb \
	spec/lib/carto/valid_table_name_proposer_spec.rb \
	spec/lib/carto/db/sanitize_spec.rb \
	spec/lib/carto/db/user_schema_spec.rb \
	spec/lib/carto/db/sql_interface_spec.rb \
	spec/lib/carto/file_system/sanitize_spec.rb \
	$(NULL)

# TODO: This block also breaks if run alongside other specs, needs checking why
WORKING_SPECS_7 = \
	spec/requests/api/json/geocodings_controller_spec.rb \
	spec/requests/carto/api/geocodings_controller_spec.rb \
	$(NULL)

WORKING_SPECS_9 = \
	services/twitter-search/spec/unit/json_to_csv_converter_spec.rb \
	services/twitter-search/spec/unit/search_api_spec.rb \
	services/datasources/spec/acceptance/datasources_factory_spec.rb \
	services/datasources/spec/acceptance/dropbox_spec.rb \
	services/datasources/spec/acceptance/gdrive_spec.rb \
	services/datasources/spec/acceptance/public_url_spec.rb \
	services/datasources/spec/integration/csv_file_dumper_spec.rb \
	services/datasources/spec/integration/twitter_spec.rb \
	services/datasources/spec/unit/arcgis_spec.rb \
	services/datasources/spec/unit/dropbox_spec.rb \
	services/datasources/spec/unit/box_spec.rb \
	services/datasources/spec/unit/gdrive_spec.rb \
	services/datasources/spec/unit/twitter_spec.rb \
	services/importer/spec/regression/query_batcher_spec.rb \
	services/platform-limits/spec/unit/input_file_size_spec.rb \
	spec/models/platform-limits/user_concurrent_imports_amount_spec.rb \
	spec/models/platform-limits/user_concurrent_syncs_amount_spec.rb \
	spec/lib/initializers/carto_db_spec.rb \
	spec/requests/carto/api/oembed_controller_spec.rb \
	spec/models/asset_spec.rb \
	spec/models/access_token_spec.rb \
	spec/requests/carto/api/permissions_controller_spec.rb \
	spec/models/shared_entity_spec.rb \
	spec/models/carto/shared_entity_spec.rb \
	spec/requests/signup_controller_spec.rb \
	spec/requests/account_tokens_controller_spec.rb \
	spec/requests/password_change_controller_spec.rb \
	spec/requests/superadmin/users_spec.rb \
	spec/requests/superadmin/organizations_spec.rb \
	spec/requests/superadmin/feature_flag_spec.rb \
	spec/requests/superadmin/oauth_apps_spec.rb \
	spec/requests/superadmin/platform_controller_spec.rb \
	spec/requests/superadmin/account_types_spec.rb \
	spec/requests/api/visualizations_spec.rb \
	spec/requests/carto/api/overlays_controller_spec.rb \
	spec/models/carto/user_creation_spec.rb \
	spec/requests/carto/api/invitations_controller_spec.rb \
	spec/requests/user_state_spec.rb \
	spec/models/carto/invitation_spec.rb \
	spec/models/carto/user_service_spec.rb \
	spec/models/carto/user_spec.rb \
	spec/models/carto/helpers/billing_cycle_spec.rb \
	spec/models/carto/user_table_spec.rb \
	spec/models/carto/organization_spec.rb \
	spec/models/carto/visualization_export_spec.rb \
	services/table-geocoder/spec/lib/abstract_table_geocoder_spec.rb \
	services/geocoder/spec/hires_batch_geocoder_spec.rb \
	services/geocoder/spec/hires_geocoder_spec.rb \
	services/geocoder/spec/hires_geocoder_factory_spec.rb \
	services/table-geocoder/spec/geocoder_cache_spec.rb \
	services/user-mover/spec/user_mover_spec.rb \
	$(NULL)

# Tests using spec_helper_min instead of spec_helper
SPEC_HELPER_MIN_SPECS = \
	spec/models/carto/account_type_spec.rb \
	spec/models/carto/analysis_spec.rb \
	spec/models/carto/analysis_node_spec.rb \
	spec/models/carto/api_key_spec.rb \
	spec/models/carto/layer_spec.rb \
	spec/models/carto/mobile_app_presenter_spec.rb \
	spec/models/carto/notification_spec.rb \
	spec/models/carto/oauth_access_token_spec.rb \
	spec/models/carto/oauth_app_spec.rb \
	spec/models/carto/oauth_app_user_spec.rb \
	spec/models/carto/oauth_app_organization_spec.rb \
	spec/models/carto/oauth_authorization_code_spec.rb \
	spec/models/carto/oauth_refresh_token_spec.rb \
	spec/models/carto/overlay_spec.rb \
	spec/models/carto/rate_limit_spec.rb \
	spec/models/carto/received_notification_spec.rb \
	spec/models/carto/user_db_service_spec.rb \
	spec/models/carto/user_migration_spec.rb \
	spec/models/carto/user_multifactor_auth_spec.rb \
	spec/models/table_registrar_spec.rb \
	spec/models/carto/user_migration_import_spec.rb \
	spec/requests/admin/organization_users_controller_spec.rb \
	spec/requests/carto/admin/mobile_apps_controller_spec.rb \
	spec/requests/carto/builder/datasets_controller_spec.rb \
	spec/requests/carto/api/analyses_controller_spec.rb \
	spec/requests/carto/api/maps_controller_spec.rb \
	spec/requests/carto/api/static_notifications_controller_spec.rb \
	spec/requests/carto/api/visualization_exports_controller_spec.rb \
	spec/requests/carto/api/users_controller_spec.rb \
	spec/requests/carto/api/table_presenter_spec.rb \
	spec/requests/carto/api/vizjson3_presenter_spec.rb \
	spec/requests/carto/api/public/users_controller_spec.rb \
	spec/requests/carto/oauth_provider_controller_spec.rb \
	spec/requests/carto/superadmin/organizations_controller_spec.rb \
	spec/requests/carto/superadmin/users_controller_spec.rb \
	spec/requests/carto/superadmin/user_migration_imports_spec.rb \
	spec/requests/carto/superadmin/user_migration_exports_spec.rb \
	spec/requests/carto/saml_controller_spec.rb \
	spec/services/carto/user_table_index_service_spec.rb \
	spec/services/carto/user_metadata_export_service_spec.rb \
	spec/services/carto/organization_metadata_export_service_spec.rb \
	spec/services/carto/redis_export_service_spec.rb \
	spec/lib/carto/password_validator_spec.rb \
	spec/lib/initializers/zz_patch_reconnect_spec.rb \
	spec/lib/cartodb/redis_vizjson_cache_spec.rb \
	spec/lib/carto/named_maps/template_spec.rb \
	services/dataservices-metrics/spec/unit/service_usage_metrics_spec.rb \
	spec/models/carto/mapcap_spec.rb \
	spec/requests/carto/api/api_keys_controller_spec.rb \
	spec/requests/carto/api/mapcaps_controller_spec.rb \
	spec/requests/carto/api/states_controller_spec.rb \
	spec/requests/carto/api/metrics_controller_spec.rb \
	spec/requests/carto/api/organization_notifications_controller_spec.rb \
	spec/requests/carto/api/received_notifications_controller_spec.rb \
	spec/requests/carto/api/multifactor_auths_controller_spec.rb \
	spec/lib/carto/tracking/events_spec.rb \
	spec/lib/carto/definition_spec.rb \
	spec/lib/carto/styles/cartography_spec.rb \
	spec/lib/carto/styles/point_spec.rb \
	spec/lib/carto/styles/polygon_spec.rb \
	spec/lib/carto/styles/line_spec.rb \
	spec/lib/carto/styles/geometry_spec.rb \
	spec/lib/carto/styles/presenters/cartocss_spec.rb \
	spec/lib/carto/forms_definition_spec.rb \
	spec/lib/carto/form_spec.rb \
	spec/lib/carto/oauth_provider/scopes_spec.rb \
	spec/models/carto/legend_spec.rb \
	spec/requests/carto/api/legends_controller_spec.rb \
	spec/lib/carto/legend_definition_validator_spec.rb \
	spec/lib/carto/legend_migrator_spec.rb \
	spec/lib/carto/mapcapped_visualization_updater_spec.rb \
	spec/requests/carto/api/snapshots_controller_specs.rb \
	spec/models/carto/snapshot_spec.rb \
	spec/helpers/application_helper_spec.rb \
	spec/lib/cartodb/common_data_redis_cache_spec.rb \
	spec/helpers/carto/html_safe_spec.rb \
	spec/models/carto/asset_spec.rb \
	spec/requests/carto/api/organization_assets_controller_spec.rb \
	spec/lib/carto/assets_service_spec.rb \
	spec/lib/carto/organization_assets_service_spec.rb \
	spec/lib/carto/storage_options/local_spec.rb \
	spec/lib/carto/visualization_invalidation_service_spec.rb \
	spec/lib/tasks/layers_rake_spec.rb \
	spec/lib/tasks/fix_unique_legends_spec.rb \
	spec/lib/tasks/oauth_rake_spec.rb \
	spec/models/carto/username_proposer_spec.rb \
	spec/services/carto/overquota_users_service_spec.rb \
	spec/services/visualization/common_data_service_spec.rb \
	spec/lib/carto/google_maps_api_spec.rb \
	spec/lib/tasks/fix_unique_overlays_spec.rb \
	spec/requests/password_resets_spec.rb \
	spec/requests/password_resets_controller_spec.rb \
	spec/models/carto/feature_flag_spec.rb \
	spec/mailers/user_mailer_spec.rb \
	spec/services/carto/user_multifactor_auth_update_service_spec.rb \
	spec/gears/carto_gears_api/users_service_spec.rb \
	spec/queries/carto/visualization_query_searcher_spec.rb \
	spec/queries/carto/visualization_query_orderer_spec.rb \
	$(NULL)

# This class must be tested isolated as pollutes namespace
WORKING_SPECS_carto_db_class = \
	spec/helpers/carto_db_spec.rb \
	$(NULL)

CDB_PATH=lib/assets/javascripts/cdb

prepare-test-db:
	# Else coverage reports add up and hits/line metric is invalid
	rm -rf coverage
ifdef JENKINS_URL
	cp .rspec_ci .rspec
endif
	# TODO skip this if db already exists ?
	# Clean DB connections before drop test DB
	psql -U postgres -c "select pg_terminate_backend(pid) from pg_stat_activity where datname='carto_db_test'"
	MOCHA_OPTIONS=skip_integration RAILS_ENV=test bundle exec rake cartodb:test:prepare --trace

# TODO: Ongoing removal of groups, that's the reason of holes in numbering
check-1:
	CHECK_SPEC=1 RAILS_ENV=test bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_1)
check-2:
	CHECK_SPEC=2 RAILS_ENV=test bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_2)
check-4:
	CHECK_SPEC=4 RAILS_ENV=test bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_4)
check-5:
	CHECK_SPEC=5 RAILS_ENV=test bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_5)
check-7:
	CHECK_SPEC=7 RAILS_ENV=test bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_7)
check-9:
	CHECK_SPEC=9 RAILS_ENV=test bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_9)
check-spec-helper-min:
	CHECK_SPEC=50 RAILS_ENV=test bundle exec rspec $(SPEC_HELPER_MIN_SPECS)
check-carto-db-class:
	CHECK_SPEC=51 RAILS_ENV=test bundle exec rspec $(WORKING_SPECS_carto_db_class)
check-integrations:
	CHECK_SPEC=52 RAILS_ENV=test bundle exec rspec $(WORKING_SPECS_INTEGRATIONS)

check-gear/%: %
	cd $< && bundle install && RAILS_ENV=test bundle exec rspec

check-gears: $(addprefix check-gear/, $(wildcard gears/*))

check-external: prepare-test-db check-integrations

check-prepared: check-1 check-2 check-4 check-5 check-7 check-9 check-spec-helper-min check-carto-db-class

check: prepare-test-db check-prepared check-gears
check-frontend:
	npm run test


# update cartodb.js submodule files
update_cdb:
	cd $(CDB_PATH); npm install
	cd $(CDB_PATH); make cartodb dist/cartodb.css
	cp $(CDB_PATH)/dist/cartodb.full.uncompressed.js vendor/assets/javascripts/cartodb.uncompressed.js
	cp $(CDB_PATH)/dist/cartodb.mod.torque.uncompressed.js vendor/assets/javascripts
	cp $(CDB_PATH)/dist/cartodb.css vendor/assets/stylesheets/cartodb.css


cartodbui:
	curl http://libs.cartocdn.com/cartodbui/manifest_$(REV).yml > public/assets/manifest.yml


.PHONY: develop_cdb cartodbui
