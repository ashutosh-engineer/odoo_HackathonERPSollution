# ============================================================
# Shiv Furniture Works ERP — Developer Makefile
# ============================================================

.PHONY: up down build init logs shell test restart status

# Start full stack
up:
	docker-compose up -d
	@echo "Stack started. Odoo → http://localhost:8069 | DB Admin → http://localhost:8080"

# Start with dev tools (Adminer)
dev:
	docker-compose --profile dev up -d
	@echo "Dev stack started. Adminer → http://localhost:8080"

# Stop everything
down:
	docker-compose down

# Rebuild Odoo image (after code changes)
build:
	docker-compose build odoo

# Full rebuild
rebuild:
	docker-compose down
	docker-compose build --no-cache odoo
	docker-compose up -d

# Initialize all modules into DB
init:
	docker-compose exec odoo odoo \
		--db_host=pgbouncer --db_port=5432 \
		--db_user=shiv_odoo --db_password=ShivSecure@2024 \
		--database=shiv_furniture_erp \
		--init=shiv_auth,shiv_product,shiv_inventory,shiv_purchase,shiv_sales,shiv_manufacturing,shiv_dashboard \
		--stop-after-init

# Update all modules (after model changes)
update:
	docker-compose exec odoo odoo \
		--db_host=pgbouncer --db_port=5432 \
		--db_user=shiv_odoo --db_password=ShivSecure@2024 \
		--database=shiv_furniture_erp \
		--update=shiv_auth,shiv_product,shiv_inventory,shiv_purchase,shiv_sales,shiv_manufacturing,shiv_dashboard \
		--stop-after-init

# View logs
logs:
	docker-compose logs -f odoo

logs-all:
	docker-compose logs -f

# Shell into Odoo container
shell:
	docker-compose exec odoo bash

# Shell into PostgreSQL
psql:
	docker-compose exec db psql -U shiv_odoo -d shiv_furniture_erp

# Shell into Redis
redis-cli:
	docker-compose exec redis redis-cli -a ShivRedis@2024

# Run all tests
test:
	docker-compose exec odoo odoo \
		--db_host=pgbouncer --db_port=5432 \
		--db_user=shiv_odoo --db_password=ShivSecure@2024 \
		--database=shiv_furniture_erp_test \
		--test-enable \
		--test-tags=shiv_auth,shiv_product,shiv_inventory,shiv_purchase,shiv_sales,shiv_manufacturing \
		--stop-after-init \
		--log-level=test

# Check service status
status:
	docker-compose ps

# Restart Odoo only (no DB restart needed for code changes)
restart:
	docker-compose restart odoo

# View DB size
db-size:
	docker-compose exec db psql -U shiv_odoo -d shiv_furniture_erp \
		-c "SELECT pg_size_pretty(pg_database_size('shiv_furniture_erp'));"

# View table sizes
db-tables:
	docker-compose exec db psql -U shiv_odoo -d shiv_furniture_erp \
		-c "SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 20;"
