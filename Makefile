.PHONY: dev test-e2e test-e2e-ui lint lint-backend lint-frontend lint-fix docker push restart

IMAGE     ?= harbor.winniewinnie.com/tracefinity/tracefinity
TAG       ?= latest
# The cluster nodes are amd64; a native build on Apple Silicon produces an
# arm64-only manifest the nodes cannot pull ("no match for platform").
PLATFORM  ?= linux/amd64
# Namespace the deployment runs in; push rolls it to pull the new image.
NAMESPACE ?= tracefinity
SHA       := $(shell git rev-parse --short HEAD)

dev:
	@trap 'kill 0' EXIT; \
	(cd backend && . venv/bin/activate && uvicorn app.main:app --reload --port 8000) & \
	(cd frontend && pnpm run dev) & \
	wait

test-e2e:
	cd frontend && E2E_TEST_MODE=1 GOOGLE_API_KEY=mock pnpm exec playwright test

test-e2e-ui:
	cd frontend && E2E_TEST_MODE=1 GOOGLE_API_KEY=mock pnpm exec playwright test --ui

lint: lint-backend lint-frontend

lint-backend:
	ruff check backend/

lint-frontend:
	cd frontend && pnpm run lint
	cd frontend && pnpm exec tsc --noEmit

lint-fix:
	ruff check backend/ --fix
	cd frontend && pnpm run lint:fix

docker:
	docker build --build-arg APP_VERSION=$(SHA) -t $(IMAGE):$(TAG) .

# Build for the cluster's architecture, load the (cross-built) image into the
# local docker store, then push. --load keeps this working with the default
# "docker" buildx driver, which cannot push to a registry directly. Finally roll
# the deployment so the node pulls the new :latest image.
push:
	docker buildx build --platform $(PLATFORM) --build-arg APP_VERSION=$(SHA) -t $(IMAGE):$(TAG) --load .
	docker push $(IMAGE):$(TAG)
	kubectl rollout restart deployment/tracefinity -n $(NAMESPACE)

restart:
	kubectl rollout restart deployment/tracefinity -n $(NAMESPACE)
