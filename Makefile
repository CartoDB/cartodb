PENDING_SPECS = \
  spec/lib/varnish_spec.rb (#321) \
  $(NULL)

WORKING_SPECS = \
  spec/lib/failed_imports_spec.rb \
  spec/lib/sql_parser_spec.rb \
  spec/lib/sql_test_spec.rb \
  spec/lib/string_spec.rb \
  spec/lib/metrics_spec.rb \
  spec/models/layer_spec.rb \
  spec/models/tag_spec.rb \
  spec/models/map_spec.rb \
  $(NULL)

CDB_PATH=lib/assets/javascripts/cdb

all:
	@echo "Try make check"

prepare-test-db:
	# TODO skip this if db already exists ?
	bundle exec rake cartodb:test:prepare

check-prepared:
	bundle exec rspec $(WORKING_SPECS)

check: prepare-test-db check-prepared


# update cartodb.js submodule files
update_cdb:
	cd $(CDB_PATH); make cartodb dist/cartodb.css
	cp $(CDB_PATH)/dist/cartodb.full.uncompressed.js vendor/assets/javascripts/cartodb.uncompressed.js
	cp $(CDB_PATH)/dist/cartodb.mod.torque.uncompressed.js vendor/assets/javascripts
	cp $(CDB_PATH)/dist/cartodb.css vendor/assets/stylesheets/cartodb.css

develop_cdb:
	while true; do make update_cdb 1>/dev/null; sleep 2; done

.PHONY: develop_cdb



