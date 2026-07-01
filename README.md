# Sigit Messanger

Simple offline-ready global chatroom with React, Express, and Socket.IO.

The runtime container does not need internet access. All dependencies are installed while building the image. The only runtime input expected outside the image is the mounted chat config file.

## Config

The server reads config from `CONFIG_PATH`, defaulting to:

```bash
/config/chat-config.json
```

For Docker Compose, edit the external file at:

```bash
./config/chat-config.json
```

If the file is missing, invalid JSON, or has an invalid shape, the server exits with a clear startup error.

## Build Docker Image

```bash
docker build -t oresperansa/sigit-messanger:0.2.0 -t oresperansa/sigit-messanger:latest .
```

## Run With Docker Compose

```bash
docker compose up --build
```

Open:

```text
http://localhost:3000
```

Compose mounts the config as read-only:

```text
./config/chat-config.json:/config/chat-config.json:ro
```

After editing `./config/chat-config.json`, restart the container so the server reloads it.

## Helm Deploy

Build and make the image available to the cluster first, then deploy:

```bash
helm install chatroom ./helm/chatroom
```

Override values when needed:

```bash
helm upgrade --install chatroom ./helm/chatroom \
  --set image.repository=oresperansa/sigit-messanger \
  --set image.tag=0.2.0
```

The chart creates a ConfigMap containing `chat-config.json` and mounts it at:

```text
/config/chat-config.json
```

Configure names and IP overrides in `helm/chatroom/values.yaml` under `chatConfig`.

## Offline Image Transfer

On a machine with build access:

```bash
docker build -t oresperansa/sigit-messanger:0.2.0 -t oresperansa/sigit-messanger:latest .
docker save oresperansa/sigit-messanger:0.2.0 -o sigit-messanger.tar
```

Move `sigit-messanger.tar` to the offline server, then load it:

```bash
docker load -i sigit-messanger.tar
```

Run it with Docker Compose or load it into your Kubernetes node/container registry. Runtime requires no internet access, no CDN, no external fonts, no remote assets, and no package installs.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `production` | Runtime mode |
| `PORT` | `3000` | HTTP port |
| `CONFIG_PATH` | `/config/chat-config.json` | External config path |
| `TRUST_PROXY` | `false` | Set to `true` behind a trusted proxy or Kubernetes ingress |
