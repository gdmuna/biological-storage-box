# Docker deployment layouts

This directory contains two intentionally separate Compose entry points.

| File | Starts | Use it when |
| --- | --- | --- |
| `compose.full.yaml` | backend, PostgreSQL, Valkey, RustFS, Casdoor | You need a self-contained TalosArk environment. |
| `compose.dev.yaml` | Valkey and Casdoor only | You run the backend locally and only need project-scoped development dependencies. |

Neither file sets `container_name`; Compose project names isolate their networks and volumes.

## Full environment

Run the following commands from this directory:

```sh
cd packages/backend/deploy/docker
```

Copy `env/full.env.example` to `env/full.env`, provide non-empty PostgreSQL and
RustFS credentials, then run:

```sh
docker compose --env-file env/full.env -f compose.full.yaml up -d
```

The PostgreSQL initialization script creates the Prisma shadow database and the
separate Casdoor database on first initialization. It runs only when the
`postgres-data` volume is first created; it is not a migration mechanism for an
existing volume.

`POSTGRES_PASSWORD` is embedded in the backend URL and Casdoor's PostgreSQL
connection string. Use only `A-Z`, `a-z`, `0-9`, `.`, `_`, `~`, and `-` for that
value.

`CASDOOR_ORIGIN` must be the externally visible URL of Casdoor. Use HTTPS and
change Casdoor's initial administrator credentials before exposing the service.

RustFS is S3-compatible and uses the three buckets named by `S3_BUCKET_PUBLIC`,
`S3_BUCKET_PRIVATE`, and `S3_BUCKET_STAGING`. Bucket provisioning remains an
explicit operational bootstrap step; the backend does not yet create buckets at
startup.

The current backend signs uploads using its configured `S3_ENDPOINT`, which is
the internal `http://rustfs:9000` endpoint in this Compose file. Before enabling
browser-direct uploads outside Docker, configure an S3 endpoint reachable by
both the backend and browser, typically through a reverse proxy or public S3
hostname.

## Local development dependencies

From the same directory:

```sh
docker compose -f compose.dev.yaml up -d
```

This intentionally starts no backend, PostgreSQL, or RustFS. Casdoor persists
its local development state in SQLite on the `casdoor-data` volume; Valkey is
available to a locally running backend at `redis://localhost:6379`.

Stop either layout with the same `-f` argument and `down`. Add `-v` only when
you intentionally want to discard its persistent local data.
