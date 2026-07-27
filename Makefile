up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

db-shell:
	docker compose exec postgres psql -U dev -d trading_platform
