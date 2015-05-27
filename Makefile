REV=$(shell git rev-parse HEAD)

all:
	bundle install
	# I cannot remmeber why gdal is being skipped from this list...
	cat python_requirements.txt | grep -v gdal | sudo pip install -r /dev/stdin
	npm install

PENDING_SPECS = \
  spec/lib/varnish_spec.rb (#321) \
  $(NULL)

WORKING_SPECS_1 = \
  spec/rspec_configuration.rb \
  spec/models/table_spec.rb \
	spec/models/table/relator_spec.rb \
  spec/models/user_spec.rb \
  spec/models/user_presenter_spec.rb \
  spec/models/layer_spec.rb \
  spec/models/layer/presenter_spec.rb \
  spec/requests/api/json/layer_presenter_spec.rb \
  spec/requests/carto/api/layer_presenter_spec.rb \
  spec/models/map_spec.rb \
  spec/models/map/copier_spec.rb \
  $(NULL)

WORKING_SPECS_2 = \
  spec/rspec_configuration.rb \
  spec/models/visualization/*.rb \
  spec/models/named_maps_spec.rb \
  spec/models/geocoding_spec.rb \
  spec/models/common_data_spec.rb \
  spec/lib/sql_parser_spec.rb \
  spec/lib/string_spec.rb \
  spec/lib/metrics_spec.rb \
  spec/lib/image_metadata_spec.rb \
  spec/lib/central_spec.rb \
	spec/helpers/uuidhelper_spec.rb \
  $(NULL)

WORKING_SPECS_3 = \
  spec/rspec_configuration.rb \
  services/importer/spec/acceptance/csv_spec.rb \
  services/importer/spec/acceptance/geojson_spec.rb \
  services/importer/spec/acceptance/gpx_spec.rb \
  services/importer/spec/acceptance/kml_spec.rb \
  services/importer/spec/acceptance/mapinfo_spec.rb \
  services/importer/spec/acceptance/osm_spec.rb \
  services/importer/spec/acceptance/shp_spec.rb \
  services/importer/spec/acceptance/sql_spec.rb \
  services/importer/spec/acceptance/zip_spec.rb \
  services/importer/spec/acceptance/raster2pgsql_spec.rb \
  services/importer/spec/unit/column_spec.rb \
  services/importer/spec/unit/csv_normalizer_spec.rb \
	services/importer/spec/unit/shp_normalizer_spec.rb \
  services/importer/spec/unit/downloader_spec.rb \
  services/importer/spec/unit/georeferencer_spec.rb \
  services/importer/spec/unit/importer_stats_spec.rb \
  services/importer/spec/unit/json2csv_spec.rb \
  services/importer/spec/unit/kml_splitter_spec.rb \
  services/importer/spec/unit/loader_spec.rb \
  services/importer/spec/unit/mail_notifier_spec.rb \
  services/importer/spec/unit/sql_loader_spec.rb \
  services/importer/spec/unit/ogr2ogr_spec.rb \
  services/importer/spec/unit/post_import_handler_spec.rb \
  services/importer/spec/unit/runner_spec.rb \
  services/importer/spec/unit/unp_spec.rb \
  services/importer/spec/unit/url_translator/fusion_tables_spec.rb \
  services/importer/spec/unit/url_translator/github_spec.rb \
  services/importer/spec/unit/url_translator/google_docs_spec.rb \
  services/importer/spec/unit/url_translator/google_maps_spec.rb \
  services/importer/spec/unit/url_translator/osm2_spec.rb \
  services/importer/spec/unit/url_translator/osm_spec.rb \
  services/importer/spec/unit/source_file_spec.rb \
  services/importer/spec/unit/content_guesser_spec.rb \
  services/importer/spec/unit/namedplaces_guesser_spec.rb \
  $(NULL)

WORKING_SPECS_4 = \
  spec/rspec_configuration.rb \
  services/wms/spec/unit/wms_spec.rb \
  services/sql-api/spec/sql_api_spec.rb \
  spec/requests/admin/visualizations_spec.rb \
  spec/requests/api/json/visualizations_controller_spec.rb \
  spec/requests/carto/api/visualizations_controller_spec.rb \
  spec/requests/api/json/tables_controller_spec.rb \
  spec/requests/carto/api/tables_controller_spec.rb \
  spec/queries/carto/visualization_query_builder_spec.rb \
  spec/requests/admin/tables_spec.rb \
  spec/requests/admin/pages_controller_spec.rb \
  $(NULL)

WORKING_SPECS_5 = \
  spec/rspec_configuration.rb \
  spec/requests/api/imports_spec.rb \
  spec/requests/api/json/imports_controller_spec.rb \
	spec/requests/carto/api/imports_controller_spec.rb \
  spec/connectors/importer_spec.rb \
  spec/requests/api/geocodings_spec.rb \
  services/importer/spec/unit/url_translator/osm_spec.rb \
  services/importer/spec/unit/url_translator/osm2_spec.rb \
  services/importer/spec/unit/mail_notifier_spec.rb \
  services/relocator/spec/relocator_spec.rb \
  $(NULL)

WORKING_SPECS_6 = \
  spec/rspec_configuration.rb \
  spec/requests/api/assets_spec.rb \
  spec/requests/api/user_layers_spec.rb \
  spec/requests/api/json/layers_controller_spec.rb \
  spec/requests/carto/api/layers_controller_spec.rb \
  spec/requests/api/map_layers_spec.rb \
  spec/requests/api/json/records_controller_spec.rb \
  spec/requests/carto/api/records_controller_spec.rb \
  spec/requests/api/json/columns_controller_spec.rb \
  spec/requests/carto/api/columns_controller_spec.rb \
  $(NULL)

WORKING_SPECS_7 = \
  spec/rspec_configuration.rb \
  spec/requests/api/synchronizations_spec.rb \
	spec/requests/api/json/synchronizations_controller_spec.rb \
	spec/requests/carto/api/synchronizations_controller_spec.rb \
  services/geocoder/spec/geocoder_spec.rb \
	services/table-geocoder/spec/internal-geocoder/input_type_resolver_spec.rb \
	services/table-geocoder/spec/internal-geocoder/query_generator_factory_spec.rb \
  spec/models/synchronization/member_spec.rb \
	spec/requests/api/json/geocodings_controller_spec.rb \
	spec/requests/carto/api/geocodings_controller_spec.rb \
  # spec/models/synchronization/collection_spec.rb not working right now \
  spec/models/synchronization/synchronization_oauth_spec.rb \
  spec/models/organization_spec.rb \
  spec/models/permission_spec.rb \
  specs/models/overlay/member.rb \
  specs/models/overlay/collection.rb \
  $(NULL)

WORKING_SPECS_8 = \
  spec/models/asset_spec.rb \
  spec/rspec_configuration.rb \
  spec/requests/api/permissions_controller_spec.rb \
  spec/models/shared_entity_spec.rb \
  spec/requests/superadmin/users_spec.rb \
  spec/requests/superadmin/organizations_spec.rb \
  spec/requests/api/visualizations_spec.rb \
  spec/requests/api/json/maps_controller_spec.rb \
  spec/requests/carto/api/maps_controller_spec.rb \
  spec/requests/api/json/overlays_controller_spec.rb \
  spec/requests/carto/api/overlays_controller_spec.rb \
  $(NULL)

WORKING_SPECS_9 = \
  spec/rspec_configuration.rb \
  services/twitter-search/spec/unit/ \
  services/datasources/spec/acceptance/datasources_factory_spec.rb \
  services/datasources/spec/integration/ \
  services/datasources/spec/unit/arcgis_spec.rb \
  services/importer/spec/regression/query_batcher_spec.rb \
  services/importer/spec/regression/cartodb_id_query_batcher_spec.rb \
  services/platform-limits/spec/unit/ \
  spec/models/platform-limits/ \
  spec/lib/initializers/carto_db_spec.rb \
  spec/unit/controllers/api/json/oembed_controller_spec.rb \
  spec/models/carto/ \
  $(NULL)

CDB_PATH=lib/assets/javascripts/cdb

prepare-test-db:
ifdef JENKINS_URL
	cp .rspec_ci .rspec
endif
	# TODO skip this if db already exists ?
	bundle exec rake cartodb:test:prepare

check-1:
	bundle exec rspec $(WORKING_SPECS_1)
check-2:
	bundle exec rspec $(WORKING_SPECS_2)
check-3:
	bundle exec rspec $(WORKING_SPECS_3)
check-4:
	bundle exec rspec $(WORKING_SPECS_4)
check-5:
	bundle exec rspec $(WORKING_SPECS_5)
check-6:
	bundle exec rspec $(WORKING_SPECS_6)
check-7:
	bundle exec rspec $(WORKING_SPECS_7)
check-8:
	bundle exec rspec $(WORKING_SPECS_8)
check-9:
	bundle exec rspec $(WORKING_SPECS_9)

check-prepared: check-1 check-2 check-3 check-4 check-5 check-6 check-7 check-8 check-9

check: prepare-test-db check-prepared
check-frontend:
	grunt test

travis: check-frontend check


# update cartodb.js submodule files
update_cdb:
	cd $(CDB_PATH); npm install
	cd $(CDB_PATH); make cartodb dist/cartodb.css
	cp $(CDB_PATH)/dist/cartodb.full.uncompressed.js vendor/assets/javascripts/cartodb.uncompressed.js
	cp $(CDB_PATH)/dist/cartodb.mod.torque.uncompressed.js vendor/assets/javascripts
	cp $(CDB_PATH)/dist/cartodb.mod.odyssey.uncompressed.js vendor/assets/javascripts
	cp $(CDB_PATH)/dist/cartodb.css vendor/assets/stylesheets/cartodb.css


cartodbui:
	curl http://libs.cartocdn.com/cartodbui/manifest_$(REV).yml > public/assets/manifest.yml


.PHONY: develop_cdb cartodbui



