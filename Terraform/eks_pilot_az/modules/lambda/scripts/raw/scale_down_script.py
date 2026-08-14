import boto3
## Scale down script for eks nodegroups
def lambda_handler(event, context):

    region_name = "us-west-2"
    
    cluster_name = "pilot-eks-secondary"

    eks = boto3.client("eks", region_name=region_name)

    

    nodegroup_names = ["pilot-eks-secondary-nodes"]
    new_desiredSize = 0
    new_minSize = 0
    new_maxSize = 1

    # Loop through the node groups and update their desired capacity to 0
    for nodegroup_name in nodegroup_names:
        response = eks.update_nodegroup_config(
            clusterName=cluster_name,
            nodegroupName=nodegroup_name,
            scalingConfig={
                "desiredSize": new_desiredSize,
                "minSize": new_minSize,
                "maxSize": new_maxSize
            }
        )

        # Print the response
        print(response)