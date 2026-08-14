import boto3
import urllib3

http = urllib3.PoolManager()
secondary_region = "us-west-2"
## scale up script for eks nodegroups
def lambda_handler(event, context):

    
    eks = boto3.client('eks', region_name=secondary_region)

    cluster_name = "pilot-eks-secondary"
    ## desired size
    nodegroup_sizes = {
        'pilot-eks-secondary-nodes': 2

    }
    # matches terraform variable "node_groups"
    nodegroup_minsizes = {
        'pilot-eks-secondary-nodes': 0
    }

    nodegroup_maxsizes = {
        'pilot-eks-secondary-nodes': 2
    }

    for nodegroup_name, max_size in nodegroup_maxsizes.items():
        response = eks.describe_nodegroup(
            clusterName=cluster_name,
            nodegroupName=nodegroup_name
        )
        current_size = response['nodegroup']['scalingConfig']['maxSize']

        if max_size != current_size:
            response = eks.update_nodegroup_config(
                clusterName=cluster_name,
                nodegroupName=nodegroup_name,
                scalingConfig={
                    'maxSize': max_size
                }
            )
            print(
                f"Updated maximum size for node group {nodegroup_name} to {max_size}")
        else:
            print(
                f"Maximum size is already {max_size} for node group {nodegroup_name}")

    for nodegroup_name, desired_size in nodegroup_sizes.items():
        response = eks.describe_nodegroup(
            clusterName=cluster_name,
            nodegroupName=nodegroup_name
        )
        current_size = response['nodegroup']['scalingConfig']['desiredSize']

        if desired_size != current_size:
            response = eks.update_nodegroup_config(
                clusterName=cluster_name,
                nodegroupName=nodegroup_name,
                scalingConfig={
                    'desiredSize': desired_size
                }
            )
            print(
                f"Updated desired size for node group {nodegroup_name} to {desired_size}")
        else:
            print(
                f"Desired size is already {desired_size} for node group {nodegroup_name}")

    for nodegroup_name, min_size in nodegroup_minsizes.items():
        response = eks.describe_nodegroup(
            clusterName=cluster_name,
            nodegroupName=nodegroup_name
        )
        current_size = response['nodegroup']['scalingConfig']['minSize']

        if min_size != current_size:
            response = eks.update_nodegroup_config(
                clusterName=cluster_name,
                nodegroupName=nodegroup_name,
                scalingConfig={
                    'minSize': min_size
                }
            )
            print(
                f"Updated minimal size for node group {nodegroup_name} to {min_size}")
        else:
            print(
                f"Minimal size is already {min_size} for node group {nodegroup_name}")
            
  # ---- Trigger Jenkins job ----
    trigger_jenkins_job(cluster_name)


def get_ssm_param(name, decrypt=True):
    ssm = boto3.client('ssm', region_name=secondary_region)
    return ssm.get_parameter(Name=name, WithDecryption=decrypt)['Parameter']['Value']

def trigger_jenkins_job(cluster_name):
    jenkins_base_url = get_ssm_param("/gradproj/jenkins/url")
    job_name = get_ssm_param("/gradproj/jenkins/job-name")
    api_token = get_ssm_param("/gradproj/jenkins/api-token")
    jenkins_user = get_ssm_param("/gradproj/jenkins/username")  # new param needed

    import urllib.parse
    encoded_cluster = urllib.parse.quote(cluster_name)

    url = f"{jenkins_base_url}/job/{job_name}/buildWithParameters?CLUSTER_NAME={encoded_cluster}"

    headers = urllib3.make_headers(basic_auth=f"{jenkins_user}:{api_token}")

    try:
        resp = http.request("POST", url, headers=headers, timeout=urllib3.Timeout(connect=5, read=15))
        if resp.status in (200, 201):
            print(f"Triggered Jenkins job '{job_name}' successfully (status {resp.status})")
        else:
            print(f"Jenkins trigger returned status {resp.status}: {resp.data}")
    except Exception as e:
        print(f"Failed to trigger Jenkins job: {e}")