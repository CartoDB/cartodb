REV=$(shell git rev-parse HEAD)
RUBY_MAJOR=$(shell ruby -e "puts RUBY_VERSION" | cut -d. -f1)

all:
	RAILS_ENV=test bundle install
	# I cannot remmeber why gdal is being skipped from this list...
	cat python_requirements.txt | grep -v gdal | sudo pip install -r /dev/stdin
	npm install

WORKING_SPECS_1 = \
	spec/models/table_spec.rb \
	$(NULL)

WORKING_SPECS_2 = \
	spec/lib/cartodb/stats/importer_spec.rb \
	$(NULL)

WORKING_SPECS_4 = \
	services/wms/spec/unit/wms_spec.rb \
	$(NULL)

WORKING_SPECS_5 = \
	spec/requests/api/assets_spec.rb \
	$(NULL)

# TODO: This block also breaks if run alongside other specs, needs checking why
WORKING_SPECS_7 = \
	spec/requests/api/json/geocodings_controller_spec.rb \
	$(NULL)

WORKING_SPECS_9 = \
	services/twitter-search/spec/unit/json_to_csv_converter_spec.rb \
	$(NULL)

# Tests using spec_helper_min instead of spec_helper
SPEC_HELPER_MIN_SPECS = \
	spec/models/carto/account_type_spec.rb \
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
	MOCHA_OPTIONS=skip_integration RAILS_ENV=test COVERBAND_DISABLE_AUTO_START=true bundle exec rake cartodb:test:prepare --trace

# TODO: Ongoing removal of groups, that's the reason of holes in numbering
check-1:
	CHECK_SPEC=1 RAILS_ENV=test COVERBAND_DISABLE_AUTO_START=true bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_1)
check-2:
	CHECK_SPEC=2 RAILS_ENV=test COVERBAND_DISABLE_AUTO_START=true bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_2)
check-4:
	CHECK_SPEC=4 RAILS_ENV=test COVERBAND_DISABLE_AUTO_START=true bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_4)
check-5:
	CHECK_SPEC=5 RAILS_ENV=test COVERBAND_DISABLE_AUTO_START=true bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_5)
check-7:
	CHECK_SPEC=7 RAILS_ENV=test COVERBAND_DISABLE_AUTO_START=true bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_7)
check-9:
	CHECK_SPEC=9 RAILS_ENV=test COVERBAND_DISABLE_AUTO_START=true bundle exec rspec --require ./spec/rspec_configuration.rb $(WORKING_SPECS_9)
check-spec-helper-min:
	CHECK_SPEC=50 RAILS_ENV=test COVERBAND_DISABLE_AUTO_START=true bundle exec rspec $(SPEC_HELPER_MIN_SPECS)
check-carto-db-class:
	CHECK_SPEC=51 RAILS_ENV=test COVERBAND_DISABLE_AUTO_START=true bundle exec rspec $(WORKING_SPECS_carto_db_class)

check-gear/%: %
	cd $< && bundle install && RAILS_ENV=test COVERBAND_DISABLE_AUTO_START=true bundle exec rspec

check-gears: $(addprefix check-gear/, $(wildcard gears/*))

check-external: prepare-test-db

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
