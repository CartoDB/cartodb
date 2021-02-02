BRANCH_TAG=$(echo $BRANCH_NAME | sed -r 's,/,_,g') && echo $BRANCH_TAG
docker pull gcr.io/cartodb-on-gcp-main-artifacts/builder:${BRANCH_TAG}
if [ ! -z "$?" ]
then
          docker pull gcr.io/cartodb-on-gcp-main-artifacts/builder:latest
          docker tag gcr.io/cartodb-on-gcp-main-artifacts/builder:latest gcr.io/cartodb-on-gcp-main-artifacts/builder:${BRANCH_TAG}
fi
