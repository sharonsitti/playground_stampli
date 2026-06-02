.PHONY: \
	client-install client-dev client-build client-lint client-typecheck client-test client-check \
	server-install server-dev \
	install install-hooks dev check

client-install: ## Install frontend JS dependencies
	cd app && npm install

client-dev: ## Start the frontend dev server
	cd app && npm run dev

client-build: ## Build the frontend for production
	cd app && npm run build

client-lint: ## Check JS style and formatting
	cd app && npm run lint && npx prettier --check .

client-typecheck: ## Run TypeScript type checking
	cd app && npm run typecheck

client-test: ## Run the JS test suite
	cd app && npm test

client-check: client-lint client-typecheck client-test ## Lint, typecheck, and test the frontend

server-install: ## Install API dependencies
	cd server && npm install

server-dev: ## Start the API dev server
	cd server && npm run dev

install: install-hooks client-install server-install ## Install all dependencies and the git pre-commit hook

install-hooks: ## Point git at the committed .githooks/ directory
	git config core.hooksPath .githooks

dev: ## Start both servers in parallel
	$(MAKE) -j2 client-dev server-dev

check: client-check ## Run all checks
