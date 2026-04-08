 # Build Verb Lookup Pack

This project can build a local compressed lookup pack from the verb.mt dataset without committing the raw source files into the site repository.

## Source data

Set the source folder with an environment variable:

```text
MALTI_VERB_MT_SOURCE
```

## Output

Optional output override:

```text
MALTI_VERB_LOOKUP_OUTPUT
```

If `MALTI_VERB_LOOKUP_OUTPUT` is not set, generated files go to:

```text
assets\data\generated
```

By default the script writes:

- `verb_lookup_manifest.json`
- `verb_lookup_pack.msgpack.gz`

Optional debug file:

- `verb_lookup_pack.json`

The generated folder is ignored by git.

## Local extensions

Additional local verbs and aliases can be added in:

```text
assets\data\verbs_extensions.json
```

These entries are merged into the final pack during the build, so the browser does not need a separate runtime overrides file.

## Run

The script first looks for a repo-root `.env` file, then falls back to process environment variables, then to CLI flags.

Example `.env`:

```dotenv
MALTI_VERB_MT_SOURCE=\Library\Lang\Maltese\verb\data\verbs
MALTI_VERB_LOOKUP_OUTPUT=\malti-notes\assets\data\generated
```

PowerShell example:

```powershell
$env:MALTI_VERB_MT_SOURCE='\Library\Lang\Maltese\verb\data\verbs'
```

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\build_verb_lookup_pack.py
```

To also emit an uncompressed JSON copy:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\build_verb_lookup_pack.py --emit-json
```

You can also override paths explicitly:

```powershell
C:\Python313\python.exe C:\Workspace\prj\jq\malti-notes\scripts\build_verb_lookup_pack.py --source C:\path\to\verbs --output C:\path\to\generated
```

## What the pack contains

- `index`: lightweight verb catalogue for lookup and drill entry points
- `forms`: normalized form lookup such as `ghamilt -> [possible analyses]`
- `aliases`: extra lookup aliases for course forms and local extensions
- `englishIndex`: normalized English meaning index such as `pay -> [matching verbs]`
- `tables`: compact positive present/past/imperative-style tables for drill generation
- `details`: modal dialog data for full local verb previews

The published binary artifact is MessagePack compressed with gzip.

## Current scope

The current build keeps:

- positive columns
- present (`imperfett`)
- past (`perfett`)
- imperative (`imperattiv`) when available

It also tries to repair common mojibake inside the source JSON during the build step.
