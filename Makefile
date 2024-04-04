live-reload:
	uvicorn app:app --port 5000 --reload

start-web:
	cd web && npm start