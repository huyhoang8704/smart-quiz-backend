docker compose --env-file .env.prod up # For product
docker compose --env-file .env up # For dev 

docker compose --env-file .env up --build --force-recreate