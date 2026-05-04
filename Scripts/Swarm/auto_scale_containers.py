import requests
import json
import time
import subprocess

# Scaling thresholds
SCALING_SERVICES = {
    "production_stack_nginx": {
        "cpu_threshold": 80,
        "memory_threshold": 80,
        "scale_up_step": 1,
        "scale_down_step": 1,
        "min_replicas": 1,
        "max_replicas": 2
    },
    "production_stack_storage_client": {
        "cpu_threshold": 80,
        "memory_threshold": 80,
        "scale_up_step": 1,
        "scale_down_step": 1,
        "min_replicas": 1,
        "max_replicas": 2
    },
    "production_stack_ems_client": {
        "cpu_threshold": 80,
        "memory_threshold": 80,
        "scale_up_step": 1,
        "scale_down_step": 1,
        "min_replicas": 1,
        "max_replicas": 2
    },
    "production_stack_mysql_db": {
        "cpu_threshold": 80,
        "memory_threshold": 80,
        "scale_up_step": 1,
        "scale_down_step": 1,
        "min_replicas": 1,
        "max_replicas": 1  # stateful — never scale
    },
    "production_stack_ems_server": {
        "cpu_threshold": 80,
        "memory_threshold": 80,
        "scale_up_step": 1,
        "scale_down_step": 1,
        "min_replicas": 1,
        "max_replicas": 2
    },
    "production_stack_hospital_client": {
        "cpu_threshold": 80,
        "memory_threshold": 80,
        "scale_up_step": 1,
        "scale_down_step": 1,
        "min_replicas": 1,
        "max_replicas": 2
    },
    "production_stack_hospital_server": {
        "cpu_threshold": 80,
        "memory_threshold": 80,
        "scale_up_step": 1,
        "scale_down_step": 1,
        "min_replicas": 1,
        "max_replicas": 3
    },
    "production_stack_storage_server": {
        "cpu_threshold": 80,
        "memory_threshold": 80,
        "scale_up_step": 1,
        "scale_down_step": 1,
        "min_replicas": 1,
        "max_replicas": 2
    }
}

# Cooldown tracking — stores last scale timestamp per service
# Prevents thrashing: won't scale again until cooldown expires
_last_scaled: dict[str, float] = {}
SCALE_UP_COOLDOWN   = 60   # seconds — react quickly to load spikes
SCALE_DOWN_COOLDOWN = 180  # seconds — be conservative about removing replicas

PROMETHEUS_URL = 'http://84.8.107.143:9090'

MEMORY_PERCENT_QUERY = """avg by(container_label_com_docker_swarm_service_name)(
  container_memory_usage_bytes{
    container_label_com_docker_swarm_service_name!="",
    container_label_com_docker_stack_namespace="production_stack"
  }
  / on(container_label_com_docker_swarm_service_name, id)
  (container_spec_memory_limit_bytes{
    container_label_com_docker_swarm_service_name!="",
    container_label_com_docker_stack_namespace="production_stack"
  } > 0)
) * 100"""

# Aggregate both sides by service first, then divide — avoids label mismatch on binary op
CPU_PERCENT_QUERY = """
avg by(container_label_com_docker_swarm_service_name)(
  rate(container_cpu_usage_seconds_total{
    container_label_com_docker_swarm_service_name!="",
    container_label_com_docker_stack_namespace="production_stack"
  }[1m])
)
/ on(container_label_com_docker_swarm_service_name)
avg by(container_label_com_docker_swarm_service_name)(
  container_spec_cpu_quota{
    container_label_com_docker_swarm_service_name!="",
    container_label_com_docker_stack_namespace="production_stack"
  }
  /
  container_spec_cpu_period{
    container_label_com_docker_swarm_service_name!="",
    container_label_com_docker_stack_namespace="production_stack"
  }
) * 100"""

GET_SERVICES_REPLICAS_QUERY = """count by(container_label_com_docker_swarm_service_name)(
  (time() - container_last_seen{
    container_label_com_docker_swarm_service_name!="",
    container_label_com_docker_stack_namespace="production_stack"
  }) < 30
)"""


def execute_promql(query):
    url = f'{PROMETHEUS_URL}/api/v1/query'
    try:
        response = requests.get(url, params={'query': query}, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Prometheus error: {e}")
        return None


def extract_metric_value(result):
    """Converts Prometheus vector result → { service_name: value }"""
    services = {}
    if not result:
        return services
    try:
        for item in result.get("data", {}).get("result", []):
            service_name = item.get("metric", {}).get(
                "container_label_com_docker_swarm_service_name"
            )
            raw = item.get("value", [None, None])[1]
            if not service_name or raw is None:
                continue
            try:
                parsed = float(raw)
                services[service_name] = int(parsed) if parsed.is_integer() else parsed
            except (ValueError, TypeError):
                services[service_name] = raw  # e.g. "+Inf"
    except Exception as e:
        print(f"Error extracting metric values: {e}")
    return services


def scale_service(service_name, desired_replicas):
    """Issues docker service scale command over SSH to the Swarm manager."""
    print(f"  → Scaling {service_name} to {desired_replicas} replicas")
    try:
        result = subprocess.run(
            ["docker", "service", "scale", f"{service_name}={desired_replicas}"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            print(f"Done: {result.stdout.strip()}")
        else:
            print(f"Failed: {result.stderr.strip()}")
    except Exception as e:
        print(f"Exception during scale: {e}")


def decide_and_scale(service_name, cpu, memory, current_replicas):
    """
    Core scaling logic for one service.

    Scale-up:   either CPU or memory exceeds threshold → add step replicas
    Scale-down: both CPU and memory are below threshold → remove step replicas
    Cooldown:   skip if we scaled this service recently
    """
    config = SCALING_SERVICES.get(service_name)
    if not config:
        return  # service not managed

    # Skip if metric value is not a usable number (e.g. "+Inf" from no memory limit)
    cpu_ok     = isinstance(cpu, (int, float))
    memory_ok  = isinstance(memory, (int, float))

    if not cpu_ok and not memory_ok:
        print(f"  [SKIP] {service_name}: no valid metrics")
        return

    cpu_high    = cpu_ok    and cpu    > config["cpu_threshold"]
    memory_high = memory_ok and memory > config["memory_threshold"]
    cpu_low     = not cpu_ok    or cpu    < config["cpu_threshold"]
    memory_low  = not memory_ok or memory < config["memory_threshold"]

    now = time.time()
    last_scaled = _last_scaled.get(service_name, 0)

    # ── Scale Up ──────────────────────────────────────────────────────────────
    if cpu_high or memory_high:
        if current_replicas >= config["max_replicas"]:
            print(f"  [MAX]  {service_name}: already at max ({current_replicas})")
            return
        if now - last_scaled < SCALE_UP_COOLDOWN:
            remaining = int(SCALE_UP_COOLDOWN - (now - last_scaled))
            print(f"  [COOL] {service_name}: scale-up cooldown ({remaining}s left)")
            return

        desired = min(current_replicas + config["scale_up_step"], config["max_replicas"])
        reason  = f"CPU={cpu:.1f}%" if cpu_high else f"MEM={memory:.1f}%"
        print(f"  [UP]   {service_name}: {current_replicas} → {desired} ({reason})")
        scale_service(service_name, desired)
        _last_scaled[service_name] = now

    # ── Scale Down ────────────────────────────────────────────────────────────
    elif cpu_low and memory_low:
        if current_replicas <= config["min_replicas"]:
            print(f"  [MIN]  {service_name}: already at min ({current_replicas})")
            return
        if now - last_scaled < SCALE_DOWN_COOLDOWN:
            remaining = int(SCALE_DOWN_COOLDOWN - (now - last_scaled))
            print(f"  [COOL] {service_name}: scale-down cooldown ({remaining}s left)")
            return

        desired = max(current_replicas - config["scale_down_step"], config["min_replicas"])
        print(f"  [DOWN] {service_name}: {current_replicas} → {desired} (CPU={cpu}, MEM={memory})")
        scale_service(service_name, desired)
        _last_scaled[service_name] = now


# ── Main Loop ─────────────────────────────────────────────────────────────────
while True:
    print("\n=== Autoscaler Tick ===")

    cpu_map      = extract_metric_value(execute_promql(CPU_PERCENT_QUERY))
    memory_map   = extract_metric_value(execute_promql(MEMORY_PERCENT_QUERY))
    replicas_map = extract_metric_value(execute_promql(GET_SERVICES_REPLICAS_QUERY))

    print(f"CPU:      {cpu_map}")
    print(f"Memory:   {memory_map}")
    print(f"Replicas: {replicas_map}")
    print()

    for service_name in SCALING_SERVICES:
        cpu      = cpu_map.get(service_name)
        memory   = memory_map.get(service_name)
        replicas = replicas_map.get(service_name)

        if replicas is None:
            print(f"  [SKIP] {service_name}: no replica data")
            continue

        print(f"  {service_name}: CPU={cpu}, MEM={memory}, replicas={replicas}")
        decide_and_scale(service_name, cpu, memory, replicas)

    time.sleep(30)