# Docker operations

Each Compose layout is a self-contained directory. Its `compose.yaml`, Compose
input file, Casdoor configuration, and any layout-specific bootstrap scripts
live together; shared backend build assets remain in this directory.

```text
docker/
├── Dockerfile                         # shared backend image build
├── apt/                               # Debian source definitions used by Dockerfile
└── compose/
    ├── full/
    │   ├── compose.yaml               # backend + PostgreSQL + Valkey + RustFS + Casdoor
    │   ├── .env.example
    │   ├── casdoor/app.conf.example
    │   ├── postgres/init-databases.sh
    │   └── backend/docker-entrypoint.sh
    └── dev/
        ├── compose.yaml               # Valkey + Casdoor for local backend development
        ├── .env.example
        └── casdoor/app.conf.example
```

Each Compose directory has a `.env` input file. Docker Compose automatically
uses it to resolve `${...}` on the host when it is run from that directory; it
is not mounted into any container. Casdoor instead reads its explicitly mounted
`casdoor/app.conf`.

## Full environment

Run from the full Compose directory:

```sh
cd packages/backend/ops/docker/compose/full
cp .env.example .env
cp casdoor/app.conf.example casdoor/app.conf
docker compose up -d
```

`.env` configures the image tags, PostgreSQL superuser and databases,
host ports, and RustFS credentials. It and the local Casdoor configuration are
ignored by Git. Keep the PostgreSQL values in `.env` consistent with
`dataSourceName` and `dbName` in `casdoor/app.conf`.

`postgres/init-databases.sh` creates the Prisma shadow database and separate
Casdoor database only when the `postgres-data` volume is initialized for the
first time; it is not a migration mechanism for an existing volume.

The backend connects to PostgreSQL, Valkey, and RustFS through their internal
Compose service names. For browser-direct uploads, configure an S3 endpoint
reachable by both browser and backend, normally through a reverse proxy or a
public S3 hostname.

## Local development dependencies

Run from the development Compose directory:

```sh
cd packages/backend/ops/docker/compose/dev
cp .env.example .env
cp casdoor/app.conf.example casdoor/app.conf
docker compose up -d
```

This layout starts only Valkey and Casdoor. Casdoor joins the external network
named by `POSTGRES_NETWORK` and connects to the shared `dev-infra` PostgreSQL
service through the hostname configured in `casdoor/app.conf`; it does not run
SQLite or start another PostgreSQL container.

Stop either layout from its own directory with `docker compose down`. Add `-v`
only when intentionally discarding persistent local data.
