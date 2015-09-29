#!/bin/bash
# Jesus Vazquez
# reporter.sh

filename="specfailed.log"

lines=$(cat $filename | wc -l)

if [ "$lines" -eq "0" ];
then
        echo "Tests were OK";
        gsu "Backend tests were OK" "Backend" success
        return 0; #OK
else
        while read line; 
        do 
                # For each error cat its log file
                logfile=$(echo $line | grep -o '[0-9][0-9][0-9][0-9].log')
                cat $logfile;
                # Give feedback to github
                spec=$(echo $line | sed 's/\s.*$//')
                # echo "GSU with spec $spec"
                # gsu "$spec failed" "$spec" failure
                
        done < $filename
        gsu "Backend tests failed" "Backend" failure 
        return 1; # ERROR
fi

