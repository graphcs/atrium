.PHONY: help dev dev-down build up down logs restart clean install build-local

DOCKER_COMPOSE_PROD = docker compose -f docker/docker-compose.yml
DOCKER_COMPOSE_DEV  = docker compose -f docker/docker-compose.dev.yml

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ---- Local (no Docker) ----

install: ## Install dependencies locally
	pnpm install

build-local: ## Build all packages locally
	pnpm build

dev-local: ## Run backend + frontend locally (no Docker)
	pnpm dev

# ---- Docker Development ----

dev: ## Start dev environment (Docker, hot-reload)
	$(DOCKER_COMPOSE_DEV) up

dev-build: ## Rebuild and start dev environment
	$(DOCKER_COMPOSE_DEV) up --build

dev-down: ## Stop dev environment
	$(DOCKER_COMPOSE_DEV) down

dev-logs: ## Tail dev logs
	$(DOCKER_COMPOSE_DEV) logs -f

# ---- Docker Production ----

build: ## Build production Docker images
	$(DOCKER_COMPOSE_PROD) build

up: ## Start production containers
	$(DOCKER_COMPOSE_PROD) up -d

down: ## Stop production containers
	$(DOCKER_COMPOSE_PROD) down

logs: ## Tail production logs
	$(DOCKER_COMPOSE_PROD) logs -f

restart: ## Restart production containers
	$(DOCKER_COMPOSE_PROD) restart

# ---- Cleanup ----

clean: ## Stop all containers and remove volumes
	$(DOCKER_COMPOSE_PROD) down -v 2>/dev/null || true
	$(DOCKER_COMPOSE_DEV) down -v 2>/dev/null || true
	docker image prune -f
