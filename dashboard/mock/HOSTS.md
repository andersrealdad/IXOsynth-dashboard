# Host placeholders

Internal hostnames in this repo are **placeholders**, not real infrastructure:

| placeholder            | role                          |
|------------------------|-------------------------------|
| `pgx.local`            | notebook backend (open-notebook) |
| `station.local`        | ops host (board, system map, auth outpost) |
| `gitea.local`          | git server |
| `10.0.0.1`             | internal docker bridge |
| `docker-host.local`    | docker host gateway |

Public surfaces (`*.ixobot.com`) are real. These placeholders are display strings only —
they don't affect the build. The owner swaps them for real hosts locally via `restore-hosts.sh`.
