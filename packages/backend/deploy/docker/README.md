# Docker deployment layouts

This directory contains two intentionally separate Compose entry points.

| File | Starts | Use it when |
| --- | --- | --- |
| `compose.full.yaml` | backend, PostgreSQL, Valkey, RustFS, Casdoor | You need a self-contained TalosArk environment. |
| `compose.dev.yaml` | Valkey and Casdoor only | You run the backend locally and only need project-scoped development dependencies. |

Neither file sets `container_name`; Compose project names isolate their networks and volumes.

`env/*.env` files are Compose input files, not container-mounted configuration.
Pass one with `--env-file`; Docker Compose then resolves `${...}` in the Compose
file on the host. A variable reaches a container only when its service explicitly
declares it under `environment`. Casdoor deliberately has no such configuration:
it reads the mounted `casdoor/*/app.conf` file instead.

## Full environment

Run the following commands from this directory:

```sh
cd packages/backend/deploy/docker
```

Copy both the Compose input and Casdoor configuration templates, then edit the
two local copies so their PostgreSQL/Casdoor connection values agree:

```sh
cp env/full.env.example env/full.env
cp casdoor/full/app.conf.example casdoor/full/app.conf
docker compose --env-file env/full.env -f compose.full.yaml up -d
```

`full.env` explicitly selects all four image tags and configures the PostgreSQL
superuser, application database, shadow database, host port, and RustFS
credentials. It is ignored by Git. `casdoor/full/app.conf` is also ignored by
Git and is Casdoor's independent runtime configuration.

The checked-in `admin` credentials are local examples only. Replace them in
both local copies before any non-local deployment.

The PostgreSQL initialization script creates the Prisma shadow database and the
separate Casdoor database on first initialization. It runs only when the
`postgres-data` volume is first created; it is not a migration mechanism for an
existing volume.

`POSTGRES_PASSWORD` is embedded in the backend URL. Use only `A-Z`, `a-z`,
`0-9`, `.`, `_`, `~`, and `-` for that value. Update the matching
`dataSourceName` in `casdoor/full/app.conf` when changing the PostgreSQL
superuser credentials or `CASDOOR_DB`.

Set the externally visible Casdoor URL through `origin` in
`casdoor/full/app.conf`. Use HTTPS and change Casdoor's initial administrator
credentials before exposing the service.

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
cp env/dev.env.example env/dev.env
cp casdoor/dev/app.conf.example casdoor/dev/app.conf
docker compose --env-file env/dev.env -f compose.dev.yaml up -d
```

The development Compose file starts only Valkey and Casdoor. Casdoor joins the
external Docker network configured by `POSTGRES_NETWORK` and connects to the
already-running PostgreSQL container through the hostname configured in
`casdoor/dev/app.conf`; it does not run SQLite or create another PostgreSQL
container.

The current local PostgreSQL container is `dev-infra-postgres` on the
`dev-infra_default` network, where it is aliased as `postgres`. The supplied
templates therefore use that network and an `admin` / `admin` connection to the
existing `postgres` database. If that infrastructure changes, update both
`POSTGRES_NETWORK` in `env/dev.env` and the `dataSourceName` / `dbName` in
`casdoor/dev/app.conf`.

Valkey is available to a locally running backend at `redis://localhost:6379`.

Stop either layout with the same `-f` argument and `down`. Add `-v` only when
you intentionally want to discard its persistent local data.
