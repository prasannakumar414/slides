---
title: Docker Internals & Dockerfile Best Practices
description: How Docker works under the hood, how to write Dockerfiles, and production-grade best practices
---

# Docker Internals & Dockerfile Best Practices

Under the hood. Done right.

![Docker Hero](images/docker-hero.png)

---

## Docker Architecture

Docker uses a **client-server** architecture with multiple layers:

```
docker CLI  →  dockerd (daemon)  →  containerd  →  runc  →  container
```

- **docker CLI** — sends REST API calls to the daemon via Unix socket
- **dockerd** — manages images, containers, networks, and volumes
- **containerd** — handles container lifecycle (pull, create, start, stop)
- **runc** — the low-level OCI runtime that actually creates containers

<img src="images/docker-architecture.png" alt="Docker Architecture" width="700" />

---

## 1. Docker CLI

The CLI is a thin client — it just sends REST API calls to the daemon via a Unix socket:

```bash
# What the CLI actually does under the hood
curl --unix-socket /var/run/docker.sock http://localhost/v1.41/info
```

- Parses your commands (`docker run`, `docker build`, etc.)
- Translates them into **HTTP requests** to the Docker daemon API
- Formats and displays the response

> The CLI never touches containers directly — it's just an API client.

---

## 2. dockerd (Docker Daemon)

The main brain of Docker. A long-running background process.

**What it does:**
- Exposes the **Docker REST API** that the CLI talks to
- Manages high-level concepts: images, volumes, networks, containers
- Authenticates with registries (Docker Hub, ECR, etc.)
- Delegates actual container work **down to containerd**

```
dockerd is responsible for:
├── Accepting API requests from CLI
├── Image management (pull, push, tag, build)
├── Volume management
├── Network management (creating bridges, iptables rules)
├── Talking to containerd for container lifecycle
└── Logging drivers
```

**What it does NOT do:**
- Does not directly create containers
- Does not apply namespaces/cgroups
- Does not manage low-level filesystem snapshots

> Think of dockerd as a **manager** — it takes orders and delegates to specialists.

---

## 3. containerd

An industry-standard container runtime. Originally part of Docker, now a standalone **CNCF project**. Kubernetes uses it directly.

```
containerd is responsible for:
├── Pulling and storing image layers
├── Managing filesystem snapshots (via OverlayFS snapshotter)
├── Generating OCI spec (config.json) for runc
├── Calling runc to create the container
├── Monitoring container process lifecycle
└── Handling container events and streaming logs
```

**Key point:** containerd is designed to be **embedded and reused**. Kubernetes dropped dockerd entirely and talks to containerd directly via CRI:

```
Docker stack:        Kubernetes stack:
CLI                  kubectl
 ↓                    ↓
dockerd              kubelet
 ↓                    ↓
containerd  ←────── containerd   ← same component!
 ↓                    ↓
runc                 runc
```

---

## 4. runc

The lowest-level runtime. A tiny CLI tool that does one job — **spawn a container process**.

It reads the **OCI spec** (`config.json`) prepared by containerd, then makes the actual Linux kernel calls:

```
runc does:
├── clone()        → creates new namespaces (pid, net, mnt, uts...)
├── pivot_root()   → switches the filesystem root to image rootfs
├── write cgroups  → applies memory/CPU limits to the process
├── drop caps      → removes dangerous Linux capabilities
├── seccomp        → applies syscall filtering
└── execve()       → starts the actual container process (nginx, node, etc.)
```

**Then runc exits.** It's just a launcher. The container process continues running on its own:

```
runc lifecycle:
  containerd calls runc
    → runc sets up namespaces + cgroups
      → runc starts the process (nginx)
        → runc exits  ← gone, done its job
          → nginx keeps running
            → containerd watches nginx
```

---

## 5. containerd-shim

A small process that sits **between containerd and the container process**. One shim per container.

Without the shim, if containerd crashes or restarts, all containers would die:

```
Without shim:                    With shim:
containerd                       containerd
  └── nginx (child)                └── shim
        ↑                                └── nginx (child)
  if containerd dies,                  if containerd dies,
  nginx dies too ❌                    shim keeps nginx alive ✅
```

**What it does:**
- Keeps `stdin/stdout` pipes open for the container
- Reports container exit status back to containerd
- Allows containerd to **restart without killing containers**
- Handles TTY for interactive containers

---

## 6. OCI (Open Container Initiative)

Not a component — a **standard/specification**. Defines two specs:

- **Image spec** — what a container image must look like (layer format, manifest, config)
- **Runtime spec** — what a runtime must do given an OCI bundle (config.json + rootfs)

runc is the **reference implementation** of the OCI runtime spec. You can swap it for other OCI-compatible runtimes:

```
containerd
└── OCI runtime (pluggable)
    ├── runc          ← default, uses namespaces/cgroups
    ├── gVisor        ← Google's sandboxed runtime (extra security)
    ├── Kata          ← runs containers in lightweight VMs
    └── Firecracker   ← AWS's microVM runtime
```

<img src="images/oci-logo.png" alt="OCI Logo" width="400" />

---

## Full Flow: `docker run nginx`

```
1. Docker CLI
   └── POST /containers/create to dockerd via Unix socket

2. dockerd
   └── checks if nginx image exists locally
   └── if not, tells containerd to pull it
   └── tells containerd to create + start the container

3. containerd
   └── pulls image layers from Docker Hub (if needed)
   └── creates OverlayFS snapshot (merges layers)
   └── generates OCI spec (config.json)
   └── spawns containerd-shim
   └── calls runc with the OCI bundle

4. runc
   └── reads config.json
   └── calls clone() → new namespaces
   └── calls pivot_root() → new filesystem root
   └── writes cgroup limits
   └── drops capabilities, applies seccomp
   └── calls execve("nginx")
   └── exits ← job done

5. containerd-shim
   └── stays alive, watches nginx process
   └── reports exit code when nginx stops

6. nginx is now running
   └── isolated in its own namespaces
   └── resource-limited by cgroups
   └── sees only its own layered filesystem
```

---

## Containers Are Just Linux Processes

A container is **not** a virtual machine. It's a regular Linux process with three kernel isolation mechanisms:

| Mechanism | What it does |
| --- | --- |
| **Namespaces** | Control what a process can *see* |
| **cgroups** | Control what a process can *use* |
| **OverlayFS** | Provide an isolated filesystem |

> A container = process + namespaces + cgroups + layered filesystem

---

## Linux Namespaces — Visibility Isolation

Namespaces give each container its own scoped view of the system:

| Namespace | Isolates |
| --- | --- |
| **PID** | Process IDs — container sees only its own processes (PID 1) |
| **NET** | Network stack — own IP address, ports, routing table |
| **MNT** | Filesystem mounts — own root filesystem |
| **UTS** | Hostname and domain name |
| **IPC** | Inter-process communication (shared memory, semaphores) |
| **USER** | User and group IDs — root inside ≠ root outside |

```bash
# See a container's namespaces
ls -la /proc/<pid>/ns/

# Run a command in a new PID + network namespace
unshare --pid --net --fork bash
```

---

## Control Groups (cgroups) — Resource Limits

cgroups limit **how much** of the host's resources a container can consume:

```bash
# Run with CPU and memory limits
docker run --cpus="1.5" --memory="512m" nginx

# Equivalent kernel cgroup settings
/sys/fs/cgroup/cpu/docker/<id>/cpu.cfs_quota_us
/sys/fs/cgroup/memory/docker/<id>/memory.limit_in_bytes
```

| Resource | Flag | Example |
| --- | --- | --- |
| CPU | `--cpus` | `--cpus="2"` (max 2 cores) |
| Memory | `--memory` | `--memory="256m"` (hard limit) |
| Memory swap | `--memory-swap` | `--memory-swap="512m"` |
| Block I/O | `--blkio-weight` | `--blkio-weight=500` |
| PIDs | `--pids-limit` | `--pids-limit=100` |

> Without limits, a single container can starve the entire host.

---

## Image Layers & OverlayFS

Every Docker image is a stack of **read-only layers**. Each Dockerfile instruction creates a new layer.

<img src="images/overlay-layers.png" alt="Docker Image Layers" width="700" />

```
┌──────────────────────────────┐
│   Writable container         │  ← Container layer (read-write)
├──────────────────────────────┤
│   CMD ["./myapp"]            │  ← Layer 4 (read-only)
├──────────────────────────────┤
│   COPY myapp /usr/local/bin/ │  ← Layer 3 (read-only)
├──────────────────────────────┤
│   RUN go build -o myapp .    │  ← Layer 2 (read-only)
├──────────────────────────────┤
│   FROM golang:1.23-alpine    │  ← Layer 1 (base image)
└──────────────────────────────┘
```

- **Read path** — OverlayFS merges all layers into a single view
- **Write path** — changes go to the writable container layer (copy-on-write)
- **Delete** — a "whiteout" file hides the original from the merged view

---

## Writing a Dockerfile — The Basics

A Dockerfile is a recipe to build an image, instruction by instruction:

```dockerfile
FROM golang:1.23-alpine

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o server .

EXPOSE 8080

CMD ["./server"]
```

| Instruction | Purpose |
| --- | --- |
| `FROM` | Base image — every Dockerfile starts here |
| `WORKDIR` | Set the working directory inside the container |
| `COPY` / `ADD` | Copy files from host into image |
| `RUN` | Execute a command during build (installs, setup) |
| `EXPOSE` | Document which port the app listens on |
| `CMD` | Default command when container starts |
| `ENTRYPOINT` | Fixed command — `CMD` becomes its arguments |
| `ENV` | Set environment variables |
| `ARG` | Build-time variables (not available at runtime) |

---

## ENTRYPOINT vs CMD

These two instructions control what runs when a container starts:

```dockerfile
# CMD alone — easily overridden
CMD ["./server"]
# docker run myimage bash  →  runs bash, not ./server

# ENTRYPOINT alone — always runs
ENTRYPOINT ["./server"]
# docker run myimage --debug  →  ./server --debug

# Combined — ENTRYPOINT is fixed, CMD provides defaults
ENTRYPOINT ["./server"]
CMD ["--port", "8080"]
# docker run myimage                →  ./server --port 8080
# docker run myimage --port 9090   →  ./server --port 9090
```

> **Rule of thumb:** Use `ENTRYPOINT` for the executable, `CMD` for default arguments.

---

## Multi-Stage Builds

The biggest win for production images — build in one stage, copy only artifacts to the final stage:

```dockerfile
# Stage 1: Build
FROM golang:1.23 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server .

# Stage 2: Production
FROM alpine:3.20
WORKDIR /
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
```

| | Single stage | Multi-stage |
| --- | --- | --- |
| Image size | 1.1 GB (full Go toolchain + source) | 15 MB (alpine + static binary) |
| Attack surface | Large | Minimal |
| Build cache | Poor | Excellent |

> Multi-stage builds can reduce image size by **80–90%**.

---

## Best Practice: Optimize Layer Caching

Docker caches layers top-down. **If a layer changes, all layers below it are rebuilt.**

```dockerfile
# ❌ Bad — any source change re-downloads all dependencies
COPY . .
RUN go build -o server .

# ✅ Good — dependencies cached unless go.mod/go.sum change
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server .
```

**Cache rules:**
- `COPY` / `ADD` — cache busted if any copied file changes
- `RUN` — cache busted if the command string changes
- Order instructions from **least frequently changed** to **most frequently changed**

---

## Best Practice: Minimize Image Size

Every MB matters in CI pipelines, registries, and cold starts.

```dockerfile
# ❌ 1.1 GB — full Go toolchain
FROM golang:1.23

# ✅ 250 MB — minimal with Alpine
FROM golang:1.23-alpine

# ✅✅ 7 MB — static binary on scratch (no OS at all)
FROM scratch
COPY --from=builder /app/server /server
```

**Key techniques:**
- Use `alpine` or `scratch` / `distroless` as final stage
- Build with `CGO_ENABLED=0` for fully static binaries
- Use multi-stage builds to discard the toolchain:

```dockerfile
FROM golang:1.23 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

FROM scratch
COPY --from=builder /app/server /server
CMD ["/server"]
```

---

## Best Practice: Security

Containers run as **root** by default. Don't ship that to production.

```dockerfile
# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Switch to it
USER appuser

CMD ["./server"]
```

**Security checklist:**

- ✅ Run as non-root (`USER`)
- ✅ Use specific image tags, never `latest` in production
- ✅ Scan images for CVEs (`docker scout`, `trivy`)
- ✅ Don't store secrets in images — use build secrets or runtime injection
- ✅ Use `.dockerignore` to exclude sensitive files

```
# .dockerignore
.git
.env
*.md
vendor/
bin/
```

---

## Best Practice: Health Checks & Signals

Help Docker (and orchestrators) know if your app is healthy:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1
```

Handle **graceful shutdown** — Docker sends `SIGTERM`, then `SIGKILL` after 10s:

```dockerfile
# ❌ Shell form — runs as child of /bin/sh, won't receive signals
CMD ./server

# ✅ Exec form — PID 1, receives SIGTERM directly
CMD ["./server"]
```

> Always use **exec form** (`["cmd", "arg"]`) for `CMD` and `ENTRYPOINT`.

---

## Putting It All Together

A production-ready Dockerfile:

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

FROM alpine:3.20
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=builder /app/server /usr/local/bin/server

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1

CMD ["server"]
```

Multi-stage ✅ Non-root ✅ Cached deps ✅ Health check ✅ Exec form ✅ Static binary ✅

---

## Quick Reference Cheat Sheet

| Topic | Do | Don't |
| --- | --- | --- |
| Base image | `golang:1.23-alpine` → `scratch` | `golang:latest` |
| Dependencies | Copy `go.mod`/`go.sum` first, then `go mod download` | `COPY . .` then build |
| Layers | Combine related `RUN` commands | One `RUN` per line |
| Size | Multi-stage builds, static binaries | Ship the Go toolchain to prod |
| Security | `USER nonroot`, scan images | Run as root, embed secrets |
| CMD | Exec form `["./server"]` | Shell form `./server` |
| .dockerignore | Always include one | Copy `.git`, `vendor/`, `.env` |

---

## That's a Wrap

You now know what happens when you type `docker run`:

```
CLI → daemon → containerd → runc
  → clone(CLONE_NEWPID | CLONE_NEWNET | ...)
  → setup cgroups
  → mount overlayfs
  → exec your app as PID 1
```

> Containers aren't magic — they're just Linux processes with boundaries.
