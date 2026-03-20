#!/bin/sh

set -e -u

source .env

TOKEN=${WORKER_AUTH_TOKEN}
#API=https://www.simplelists.com/api/2
API=http://localhost:8787

firstname="Curly S"
emails="curly2120@bmaart.org"
lists="list-admins"

if [ -z "$TOKEN" ] ; then
  die "SIMPLELIST_TOKEN env var needs to be set"
fi

daynow=$(date +"%d%H%M%S")

function test_create_new() {
  curl $API -vs \
  -H "Authorization: Bearer $TOKEN" \
  -d firstname=$firstname \
  -d lists=$lists \
  -d emails=$emails
}

set -x
test_create_new

exit


get_existing_contact_from_search() {
curl -X GET \
  -vs $API/contacts/?email=curly7@bmaart.org \
  -H "Authorization: Bearer $TOKEN" | jq # ".data[0].id"
}

get_contact_by_id() {
curl -X GET \
  -vs $API/contacts/19268211/ \
  -H "Authorization: Bearer $TOKEN" | jq # ".data[0].id"
}


put_list_onto_contact() { 
curl -X PUT \
  -vs $API/contacts/19268211/ \
  -H "Authorization: Bearer $TOKEN"  \
  -d "lists=list-admins" \

}

put_list_onto_contact | jq
get_contact_by_id




exit

echo "Not here"
# -d firstname=piday \
#-d lists=list-admins \


#-H 'Authorization: Bearer VTbDSKE7NFbR8ihV96cT2z7kL5J3QZHP' \
#-H 'Content-Type: application/json' \
#-X POST \
#-d emails=curly6@bmaart.org

# Not found: 404
# {
#  "message": "Page does not exist",
#  "is_error": true
#}

# Found: 200
# {
#  "count": 1,
#  "data": [
#    {
#      "emails": [
#        {
#          "id": 17003523,
#          "ceid": null,
#          "contact": 19268211,
#          "digest": false,
#          "email": "curly7@bmaart.org",
#          "paused": false,
#          "confirmed": null
#        }
#      ],
#      "id": 19268211,
#      "firstname": null,
#      "description": "curly7@bmaart.org",
#      "lists": [],
#      "created": "2026-03-13",
#      "notes": null,
#      "surname": null
#    }
#  ],
#  "page": 1
#}
#
#