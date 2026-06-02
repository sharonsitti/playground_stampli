.PHONY: \
	client-install client-dev client-build client-lint client-typecheck client-test client-check \
	install install-hooks dev check

client-install: ## Install JS dependencies
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

install: install-hooks client-install ## Install all dependencies and the git pre-commit hook

install-hooks: ## Point git at the committed .githooks/ directory
	git config core.hooksPath .githooks

dev: client-dev ## Start the frontend dev server

check: client-check ## Run all checks
