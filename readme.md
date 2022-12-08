---
title: introduction to opensearch
author: haimtran
publishedDate: 06/11/2022
date: 06-11-2022
---

## Introduction

- setup aws opensearch
- interact via curl
- using python sdk
- [basic dsl language](https://opensearch.org/docs/latest/opensearch/query-dsl/full-text/#match)

## Architecture

![Untitled Diagram drawio](https://user-images.githubusercontent.com/20411077/205195719-e84c604d-c038-4aa2-9da0-27cd1f83cd11.png)

## Upload Data

export opensearch domain

```bash
export DOMAIN=https://$DOMAIN/$INDEX/_search
```

```bash
curl -XPUT -u $USER:$PASS $DOMAIN \
    -H 'Content-Type: application/json' \
    -d '{
          "author": "hai",
          "title":"hello minh tran",
          "year": "2022"}'

```

## Basic Search

match a field, opensearch will analyze and match with score, a full-match has highest score, but if a title contain any of match word, it is still a match

```bash
curl -XGET -u $USER:$PASS $DOMAIN \
    -H 'Content-Type: application/json' \
    -d '{
        "query": {
            "match": {
                "DocumentTitle": "ebs volume pricing"
            }
        }
    }'

```

query string

```bash
curl -XGET -u $USER:$PASS $DOMAIN \
    -H 'Content-Type: application/json' \
    -d '{
      "query": {
        "query_string": {
          "query": "ebs"
        }
      }
    }'
```

## Python SDK

```bash
python3 -m pip install opensearch-py
```

create a client

```py
import json
import uuid
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

# opensearch domain
OPENSEARCH_DOMAIN = "search-xxx.us-east-1.es.amazonaws.com"

# get credential
credentials = boto3.Session().get_credentials()
auth = AWSV4SignerAuth(credentials, region="us-east-1")

# create opensearch client
client = OpenSearch(
    hosts=[{
        'host': OPENSEARCH_DOMAIN,
        'port': 443,
    }],
    use_ssl=True,
    verify_certs=True,
    http_auth=auth,
    connection_class=RequestsHttpConnection
)
```

upload to opensearch

```py

def update_search_data() -> None:
    """
    update item with uuid
    """
    # load search data
    with open("./search-data.json","r",encoding='utf-8') as file:
        data = json.load(file)
    # update document id by uuid
    for index, item in enumerate(data):
        item["DocumentId"] = str(uuid.uuid4())
    # overwrite the search data json
    final = json.dumps(data, indent=2)
    with open("./search-data-update.json", "w", encoding='utf-8') as file:
        file.write(final)

```

create opensearch index

```py
def create_os_index(index_name):
    """
    create open search index
    """
    resp = client.indices.create(
        index_name,
        {
            "settings": {
                "index": {
                    "number_of_shards": 1
                }
            }
        }
    )
    print(resp)
    return resp
```

delete opensearch index

```py
def delete_os_index(index_name):
    """
    delete index
    """
    resp = client.indices.delete(
        index=index_name
    )
    print(resp)
    return resp
```

upload to opensearch

```py
def upload_data_to_os(index_name):
    """
    load data into opensearch index
    """
    with open("./search-data.json", "r", encoding="utf-8") as file:
        items = json.load(file)
    # loop over each item
    for item in items:
        # body
        document = {
            "DocumentTitle": item["DocumentTitle"]["Text"],
            "DocumentExcerpt": item["DocumentExcerpt"]["Text"],
            "DocumentURI": item["DocumentURI"]
        }
        # write to open search
        resp = client.index(
            index=index_name,
            id=item["DocumentId"],
            body=document
        )
        print(resp)
```

search

```py
def search_index(index_name):
    """
    test search by key word match
    """
    # query
    query = {
        # 'size': 10,
        'query': {
            'multi_match': {
                'query': 'credit',
                'fields': ['DocumentTitle', 'DocumentExcerpt', "DocumentURI"]
            }
        }
    }
    # query = {
    #     'query': {
    #         'query_string': {
    #             'query': 'credit'
    #         }
    #     }
    # }
    # search
    resp = client.search(
        index=index_name,
        body=query
    )
    #
    print(resp)
    return resp

```
