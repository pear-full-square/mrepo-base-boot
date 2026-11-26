# redeploy

Tears a child mrepo down, commits that locally, then deploys it again.

The package deployed is the one given, else the one recorded for the child.

## Signature

`redeploy(exec, { uri, args })`.

## Arguments

1. The package: optional; the recorded package when absent.

## Returns

What `teardown` says, then what `deploy` says, a line after the other.

## Errors

Those of `teardown` and `deploy`.
