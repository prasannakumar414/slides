---
title: Introduction to Docker & History
description: A complete overview of Docker — what it is, why it exists, and how it came to be
---

# Introduction to Docker

Containerize everything. Ship anywhere.

![Docker Hero](images/docker-hero.png)

---

## The Problem Docker Solves

> "It works on my machine."

- Every developer has said this. Different machines have different OS versions, runtimes, and configs — making software behave inconsistently across environments. **Docker fixes this by packaging your app with everything it needs.**

- Isolating a process and restricting resources. **Docker fixes this by creating processes with cpu and memory limits.**


---

## What is Docker?

Docker is a platform that lets you package, ship, and run applications inside **containers** — lightweight, isolated environments that run consistently on any machine.

### Core idea

- Your app + its dependencies + its config = **one container**
- That container runs **identically** on your laptop, a server, or the cloud
- **Note: Docker is not a VM**

---

## Key Concepts

### Image
A **read-only blueprint** of your application — its filesystem, dependencies, and config. Like a class in OOP.

### Container
A **running instance** of an image. Isolated, lightweight, and disposable.

### Dockerfile
A text file with step-by-step instructions to **build** an image.

### Registry
A storage hub for images — like GitHub, but for Docker images.

![Docker key concepts](images/docker-concepts.png)

---

## How It Fits Together

```
Dockerfile  →  docker build  →  Image  →  docker run  →  Container
(recipe)                       (blueprint)               (running app)
```

- **Build once** → run anywhere
- **Share images** via a registry
- **Spin up** or tear down containers in seconds

---

## Docker vs Virtual Machines

|  | Docker Container | Virtual Machine |
| --- | --- | --- |
| Boots in | Milliseconds | Minutes |
| Size | MBs | GBs |
| OS | Shares host kernel | Full OS per VM |
| Isolation | Process-level | Hardware-level |
| Use case | Apps & microservices | Full OS isolation |

> Containers are lighter because they share the host OS kernel.

![Docker vs VM](images/docker-vs-vm.png)

---

## Why Developers Love Docker

- **Consistency** — same behavior in dev, staging, and production
- **Speed** — containers start in seconds
- **Isolation** — apps don't interfere with each other
- **Portability** — runs on any machine with Docker installed
- **Scalability** — easily spin up multiple instances

---

# History of Docker

From a small startup to the foundation of modern infrastructure.

## 2008 — The Predecessor: LXC

Linux Containers (**LXC**) introduced isolated Linux environments using **namespaces** and **cgroups** — the same kernel features Docker uses today.

> LXC was powerful but complex — not developer-friendly.

## 2010 — dotCloud is Founded

- a Platform-as-a-Service startup.
- Built internal tooling to manage Linux containers efficiently that would become Docker

## March 2013 — Docker is Born

Solomon Hykes demos Docker at **PyCon 2013** in Santa Clara.

## 2013 — Explosive Growth

Within months of open sourcing:

- Thousands of GitHub stars overnight
- Contributors from Google, Red Hat, and Microsoft jumped in
- dotCloud renamed **Docker, Inc.**

> Docker solved a problem every developer had — and it was free.

---

## 2014 — The Ecosystem Explodes

- **Docker Hub** launched — public registry for sharing images
- **Docker Compose** introduced — multi-container apps with one command
- **Docker Swarm** announced — native clustering
- Google, Amazon, and Microsoft all announce Docker support

<img src="images/docker-hub.png" alt="Docker Hub" width="500" />

## June 2014 — Docker 1.0 Released

After 15 months of rapid development, Docker 1.0 is production-ready.

- Over **460 contributors**
- Over **10,000 Dockerized apps** on Docker Hub
- Adopted by Spotify, eBay, Baidu, and more

---

## 2015 — Industry Standardization

- **Open Container Initiative (OCI)** founded
- Docker, CoreOS, Google, Microsoft agree on container standards
- **runc** open sourced — the low-level runtime powering containers

<img src="images/oci-logo.png" alt="OCI logo" width="500" />

## 2016 — containerd is Born

Docker splits its runtime into **containerd** — a standalone component.

- Donated to the **CNCF**
- Kubernetes eventually adopts it directly
- Removes Docker as a Kubernetes dependency

## 2017 — Kubernetes Wins Orchestration

The battle: Docker Swarm vs Kubernetes.

- Kubernetes becomes the dominant orchestration platform
- Docker Enterprise pivots to support Kubernetes natively
- The cloud-native ecosystem standardizes
---

## That's a Wrap

Docker transformed how the world builds and ships software.

> From a 5-minute demo at PyCon to the foundation of cloud-native computing — in just over a decade.
