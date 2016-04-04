#!/bin/bash
# Jesus Vazquez
SLOW_TESTS=( 'spec/requests/carto/api/visualizations_controller_spec.rb' )

truncate -s 0 specfull.txt
cat Makefile | grep -v 'spec/lib/varnish_spec.rb'| \
grep -v 'spec/integrations/common_data_integration.rb'| \
grep -v 'spec/models/visualization/table_blender.rb'| \
grep -v 'spec/models/asset_spec.rb'| \
grep -v 'services/user-mover/spec/user_mover_spec.rb'| \
grep -v 'spec/requests/carto/api/layers_controller_spec.rb'| \
grep -v 'spec/rspec_configuration.rb'| \
grep 'rb'| sed -e 's/^\s*//' -e '/^$/d' | sed '/^#/ d' | sed 's/\\//' | sed 's/\s.*$//' > temp.txt

i=6001;
for line in ${SLOW_TESTS[@]}
do
  echo "$line $i" >> specfull.txt;
  i=$((i+1))
done

while read -r line
do
  if [[ " ${SLOW_TESTS[@]} " =~ " ${line} " ]]
  then
    continue
  fi

  echo "$line $i" >> specfull.txt;
  i=$((i+1))
done < temp.txt

echo "# Speclist has been created"
