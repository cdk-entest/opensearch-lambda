# haimtran 07 DEC 2022 
# opensearch serverless

from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import boto3
import botocore
import time
import os

# endponit exclude https
host = os.environ["OPENSEARCH_ENDPOINT"]
client = boto3.client('opensearchserverless')
service = 'aoss'
region = 'us-east-1'
credentials = boto3.Session().get_credentials()


awsauth = AWS4Auth(credentials.access_key, credentials.secret_key,
                   region, service, session_token=credentials.token)

def test_index_data(host):
    """
    """
    client = OpenSearch(
        hosts=[{'host': host, 'port': 443}],
        http_auth=awsauth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        timeout=300
    )
    print(client)
    # 
    response = client.index(
        index="cdk-entest",
        body={
            "title": "Hello",
            "creator": "Larry David",
            "year": 1989
        },
        id="1"
    )
    print(response)


def test_query_index(host):
    """
    """
    client = OpenSearch(
        hosts=[{'host': host, 'port': 443}],
        http_auth=awsauth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        timeout=300
    )
    print(client)
    # 
    response = client.search(
        index="cdk-entest",
        body={
            "query": {
                "query_string": {
                    "query": "Hello"
                }
            }
        }
    )
    print(response)



if __name__=="__main__":
    # test_index_data(host=host)
    test_query_index(host=host)