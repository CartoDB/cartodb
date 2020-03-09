#!/bin/bash
CHANNEL=C03474FL3
if [ $BRANCH_NAME == "master" ] && ! [ -z $BUILD_ID ]; then
  MSG="Cartodb master testing $BUILD_ID has failed :sadpanda:"
  echo $MSG
  curl -F text="$MSG" -F channel=$CHANNEL -F as_user=false -H "Authorization: Bearer $SLACK_TOKEN" -X POST https://slack.com/api/chat.postMessage
fi
