WORKING_SPECS = \
  spec/lib \
  spec/models/layer_spec.rb \
  spec/models/tag_spec.rb \
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
	cd $(CDB_PATH); make cartodb
	cp $(CDB_PATH)/dist/cartodb.full.uncompressed.js vendor/assets/javascripts/cartodb.uncompressed.js
	cp $(CDB_PATH)/dist/cartodb.mod.torque.uncompressed.js vendor/assets/javascripts



