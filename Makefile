REV=$(shell git rev-parse HEAD)

all:
	bundle install
	# I cannot remmeber why gdal is being skipped from this list...
	cat python_requirements.txt | grep -v gdal | sudo pip install -r /dev/stdin
	cd lib/build && npm install && cd ../..

PENDING_SPECS = \
  spec/lib/varnish_spec.rb (#321) \
  $(NULL)

WORKING_SPECS_1 = \
  spec/models/table_spec.rb \
  spec/models/user_spec.rb \
  spec/models/layer_spec.rb \
  spec/models/map_spec.rb \
  spec/models/map/copier_spec.rb \
  $(NULL)

WORKING_SPECS_2 = \
  spec/models/visualization/*.rb \
  spec/models/named_maps_spec.rb \
  spec/models/geocoding_spec.rb \
  spec/models/common_data_spec.rb \
  spec/lib/sql_parser_spec.rb \
  $(NULL)

WORKING_SPECS_3 = \
  spec/lib/string_spec.rb \
  spec/lib/metrics_spec.rb \
  spec/lib/image_metadata_spec.rb \
  services/importer/spec/unit/csv_normalizer_spec.rb \
  $(NULL)

WORKING_SPECS_4 = \
  services/wms/spec/unit/wms_spec.rb \
  services/sql-api/spec/sql_api_spec.rb \
  spec/requests/admin/visualizations_spec.rb \
  spec/requests/admin/tables_spec.rb \
  $(NULL)

WORKING_SPECS_5 = \
  spec/requests/api/imports_spec.rb \
  spec/connectors/importer_spec.rb \
  spec/requests/api/geocodings_spec.rb \
  services/importer/spec/unit/url_translator/osm_spec.rb \
  services/importer/spec/unit/url_translator/osm2_spec.rb \
  services/relocator/spec/relocator_spec.rb \
  $(NULL)

WORKING_SPECS_6 = \
  spec/requests/api/assets_spec.rb \
  spec/requests/api/user_layers_spec.rb \
  spec/requests/api/map_layers_spec.rb \
  spec/requests/api/records_spec.rb \
  $(NULL)

WORKING_SPECS_7 = \
  spec/requests/api/synchronizations_spec.rb \
  services/geocoder/spec/geocoder_spec.rb \
  spec/models/synchronization/member_spec.rb \
  # spec/models/synchronization/collection_spec.rb not working right now \
  spec/models/synchronization/synchronization_oauth_spec.rb \
  spec/models/organization_spec.rb \
  spec/models/permission_spec.rb \
  specs/models/overlay/member.rb \
  specs/models/overlay/collection.rb \
  $(NULL)

WORKING_SPECS_8 = \
  spec/requests/api/permissions_controller_spec.rb \
  spec/models/shared_entity_spec.rb \
  spec/requests/superadmin/users_spec.rb \
  spec/requests/superadmin/organizations_spec.rb \
  # Warning, run only 'uses locked filter' as the others fail
  spec/requests/api/visualizations_spec.rb:630 \
  $(NULL)

WORKING_SPECS_9 = \
  services/twitter-search/spec/unit/ \
  services/datasources/spec/acceptance/datasources_factory_spec.rb \
  services/datasources/spec/integration/ \
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
	cd lib/build && grunt test

travis: check-frontend check


# update cartodb.js submodule files
update_cdb:
	cd $(CDB_PATH); make cartodb dist/cartodb.css
	cp $(CDB_PATH)/dist/cartodb.full.uncompressed.js vendor/assets/javascripts/cartodb.uncompressed.js
	cp $(CDB_PATH)/dist/cartodb.mod.torque.uncompressed.js vendor/assets/javascripts
	cp $(CDB_PATH)/dist/cartodb.css vendor/assets/stylesheets/cartodb.css


cartodbui:
	curl http://libs.cartocdn.com/cartodbui/manifest_$(REV).yml > public/assets/manifest.yml


.PHONY: develop_cdb cartodbui



