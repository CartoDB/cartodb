#!/bin/bash

# Disclaimer:
#   We are not actively maintaining this script. We can't assure it will work, but we'll do our best to keep it updated.
# Credits:
#   Original author: https://gist.github.com/lbosque/5876697
# Contributors:
#   https://gist.github.com/andrewxhill/5884845 Mac-compatible version
#   https://gist.github.com/kentr / http://maplight.org/ new uuid format bugfix + email notification

CDB_USER=$1
API_KEY=$2
IMPORT_FILE=$3
NOTIFICATION_EMAIL=$4
PROTOCOL=https
DEBUG=true
ITEM_ID_REGEX='\"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\"'

if [[ -z $CDB_USER ]]
then
  echo "Missing user"
  exit 1
fi
if [[ -z $API_KEY ]]
then
  echo "Missing api key"
  exit 1
fi
if [[ -z $IMPORT_FILE ]]
then
  echo "Missing file"
  exit 1
fi

function log {
  if [[ ${DEBUG} == true ]]
  then
    echo $1
  fi
}

v1=$(uname)

log "Sending file '${IMPORT_FILE}'"

if [[ "$v1" = Darwin ]];
then
  job_id=`curl -s -F file=@${IMPORT_FILE} "${PROTOCOL}://${CDB_USER}.carto.com/api/v1/imports/?api_key=${API_KEY}" | sed -E "s/\{\"item_queue_id\":${ITEM_ID_REGEX}.*/\1/"`
else
  job_id=`curl -s -F file=@${IMPORT_FILE} "${PROTOCOL}://${CDB_USER}.carto.com/api/v1/imports/?api_key=${API_KEY}" | sed -r "s/\{\"item_queue_id\":${ITEM_ID_REGEX}.*/\1/"`
fi

log "Waiting for job '${job_id}' to be completed"

while true
do
  if [[ "$v1" = Darwin ]];
  then
    status=`curl -s "${PROTOCOL}://${CDB_USER}.carto.com/api/v1/imports/${job_id}?api_key=${API_KEY}" | sed -E 's/(.*)\"state\":\"([a-z]+)\"(.*)/\2/'`
  else
    status=`curl -s "${PROTOCOL}://${CDB_USER}.carto.com/api/v1/imports/${job_id}?api_key=${API_KEY}" | sed -r 's/(.*)\"state\":\"([a-z]+)\"(.*)/\2/'`
  fi
  log "JOB '${job_id}' STATE: ${status}"

  if [[ -n $NOTIFICATION_EMAIL ]]
  then
    log "${PROTOCOL}://${CDB_USER}.carto.com" | mail -s "CartoDB import finished: ${IMPORT_FILE}" "${NOTIFICATION_EMAIL}"
  fi

  if [[ $status == 'complete' ]]
  then
    log "Import successful"
    exit 0
  elif [[ $status == 'failure' ]]
  then
    log "Failed import"
    exit 1
  fi
  sleep 2
done
