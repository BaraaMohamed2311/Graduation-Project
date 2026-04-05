Create the shared monitoring network
```bash
    docker network create --driver overlay monitoring
```

Create the Docker config
```bash
    docker config create prometheus_config <path_to_prometheus.yml>
```