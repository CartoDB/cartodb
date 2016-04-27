#!/bin/bash
# Jesus Vazquez

# The following tests are disabled in a parallel environment and are run afterwards, sequentially
DISABLED_TESTS=(
  'spec/models/asset_spec.rb' # Hangs sometimes when serving files
  'services/user-mover/spec/user_mover_spec.rb' # Database recreation fails in parallel
)

# Disabled tests get put into specfailed.txt for later execution and are omitted from
# specfull.txt by builiding and OR regex (spec\|spec\|spec)
first=1
DISABLED_TEST_REGEX=''
truncate -s0 specfailed.txt
for spec in ${DISABLED_TESTS[@]}
do
  echo $spec >> specfailed.txt
  if [[ $first -eq 0 ]]
  then
    DISABLED_TEST_REGEX="$DISABLED_TEST_REGEX\\|$spec"
  else
    DISABLED_TEST_REGEX="$DISABLED_TEST_REGEX$spec"
  fi
  first=0
done

cat Makefile | \
grep -v $DISABLED_TEST_REGEX | \
grep -v 'require ./spec/rspec_configuration.rb'| \
grep 'rb'| sed -e 's/^\s*//' -e '/^$/d' | sed '/^#/ d' | sed 's/\\//' | sed 's/\s.*$//' > specfull.txt

echo "# Speclist has been created"
