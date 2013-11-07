WORKING_SPECS = \
  spec/lib \
  spec/models/layer_spec.rb \
  spec/models/tag_spec.rb \
  $(NULL)

all:
	@echo "Try make check"

prepare-test-db:
	# TODO skip this if db already exists ?
	bundle exec rake db:test:prepare

check-prepared:
	bundle exec rspec $(WORKING_SPECS)

check: prepare-test-db check-prepared


