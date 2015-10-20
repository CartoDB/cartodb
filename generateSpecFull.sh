#!/bin/bash
# Jesus Vazquez
truncate -s 0 specfull.txt
cat Makefile.parallel| grep -v -i '# S' | grep -v -i '# Pending' | grep 'rb' | sed -e 's/^\s*//' -e '/^$/d' | \
  sed '/^#/ d' | sed 's/\\//' | sed 's/\s.*$//' > temp.txt

i=6001;
while read -r line
do
  echo "$line $i" >> specfull.txt;
  i=$((i+1))
done < temp.txt

echo "# Speclist has been created"
