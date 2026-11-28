# fetch

Brings a package into the work folder's store from the sources, as they are given.

Already in the store, it is not fetched again. From a source folder,
`<path>/<org>/manifest.json` names the bundle; its addons come from
`<path>/addons/`. The sources are trusted as given: nothing is checked
here; a check of them belongs before the boot (`base-docs-hdlc`,
"Validation at the boundary").

## Signature

`fetch({ store, sources, pkg })`

## Returns

The package's manifest entry: `{ file, id, sha256, entries, addons, ... }`.

## Errors

- Not in the store nor the sources.
- A file that cannot be read or put in place: as it fails.

## Also exported

- `available(sources)`: every package the sources offer, from
  each `<org>/manifest.json`, each once, sorted.
- `structureOf({ store, pkg })`: a package's `mrepo/` part, read from its
  bundle in the store: `{ <path inside mrepo/>: bytes }`.
- `put(from, to)`: a file into place, hard linked where it shares a disk,
  else copied.
- `parseSource(s)`: a source, `folder:<path>`, parsed into
  `{ kind, path }`; anything else refused, `not a source: <s>
  (folder:<path> only)`: the platform reads local folders only.
