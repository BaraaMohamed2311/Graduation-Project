# Graduation Project — Infrastructure

Multi-service app (EMS + Hospital Management) with evolving DevOps infrastructure: Docker Swarm → Kubernetes → Multi-Region EKS.

---

## 1. Docker Swarm — CI/CD & Auto-Scaling

![Swarm Diagram](diagrams/hospital.gif)

- **Build:** Multi-stage, layer-optimized Dockerfiles (51.66% faster builds, smaller images), non-root containers.
- **Pipeline:** GitHub push → GitHub Action detects changed services → Jenkins builds & pushes versioned images → deploys with 3 handled scenarios (missing versions blocked, running services updated targeted, no blind `latest`) → k6 tests → 24h manual approval before production.
- **Auto-scaling:** Custom Python script reading Prometheus metrics, scaling via Docker socket.
- **Paths:** `Websites/`, `K6/staging_test/scripts`, `Scripts/Swarm/auto_scale_containers.py`

## 2. Swarm → Kubernetes Migration

![Kubernetes Diagram](diagrams/kubernetes_.gif)

- Same CI/CD pipeline shape, ported orchestration layer to Kubernetes.
- **Auto-scaling:** Replaced custom script with native HPA (metrics-server).
- **Security:** Kyverno policies (`disallow-latest-tag`, `disallow-privileged`, `restrict-namespace-deletion`) + RBAC roles (`devops`/`developer`, scoped per staging/production).
- **Paths:** `K6/staging_test/scripts`, `Kubernetes/remote/production`, `Kubernetes/remote/staging`, `Kubernetes/cluster-security`, `Jenkins/deploy_app_kubernetes.Jenkinsfile`

## 3. Multi-Region EKS — Disaster Recovery (Pilot-Light)

![EKS DR Diagram](diagrams/multi-region.gif)

- Secondary region kept warm with zero nodes until failover.
- **Flow:** Route53 health check → CloudWatch Alarm → SNS → Lambda scales up secondary nodes + triggers Jenkins to deploy → auto scale-down once primary recovers.
- **Why Pilot-Light:** cost optimization over Active-Active, using Spot nodes + Compute Savings Plan.
- **Est. cost (primary region):** $2,492.88/yr — [AWS Calculator](https://calculator.aws/#/estimate?id=9142f73b22c31c2a948fa6bddf62108885b20a04)
