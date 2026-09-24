# Keeping documentation current

## What updates automatically

The generator inventories all text source files under apps/backend/src, apps/backend/test, apps/admin/src, and apps/shop/src, plus selected configuration and operational files. It extracts TypeScript imports, declarations, members, and decorators using the installed backend TypeScript compiler. Each source gets a separate Markdown page and a source fingerprint. Entity mappings have a generated table index. Complete source snapshots preserve method bodies/templates so unrecognized syntax remains visible.

Run `npm run docs:watch` in a terminal while developing to refresh references after saved changes (one-second polling). `npm run docs:generate` refreshes once. All three apps also regenerate before npm build. New files under the watched source directories are discovered automatically; deleted files lose their generated pages. Private .env files, lockfiles, node_modules, build output, binary assets, and database row data are not scanned.

**Generated code facts update automatically; design rationale does not.** The generator cannot know why a business rule changed. Authored feature guides require a human or coding-agent review. The freshness check detects source changes and fails until the affected documentation has been reviewed. It does not prove the prose is semantically correct.

## Feature ownership and review

docs/manifest.json maps ordered file prefixes/exact paths to guide groups. The first matching group owns each file. All scanned sources must have an owner; a missing owner fails generation/checking. docs/review-state.json records a fingerprint over each group's sources and authored guide content.

Use:

```sh
npm run docs:generate
npm run docs:status
npm run docs:review -- backend-auth
npm run docs:check
```

Review means reading the changed source and updating the listed guide(s) when behavior, schema, API, configuration, or rationale changed. A formatting-only source change can be reviewed without editing prose. Never run review merely to silence a failure. `npm run docs:review -- --all` is available for an intentional full documentation audit, not normal automatic regeneration.

Adding a feature may initially fall under an app's general owner; create a specific manifest group and feature guide before treating it as documented. Include related tests and configuration. Update cross-cutting guides (status, database, API, decisions) when affected. A group may list several guides; shared guides can cause several review groups to need acknowledgement.

## CI and developer workflow

The documentation workflow runs on pushes/pull requests, installs backend dependencies, tests the generator, and runs docs:check without regenerating checked-in files. It catches missing/stale references, uncovered sources, stale guide review fingerprints, and broken relative file links. CI runs when the repository is hosted on GitHub; making its job a required branch protection check requires repository settings outside this code change.

Before completing a feature:
1. Change source and meaningful tests.
2. Update backend/frontend guides, contracts, tables, decisions, and known limitations.
3. Generate references.
4. Review the affected manifest groups.
5. Run docs:check and the feature's validation.
6. Commit source, authored docs, generated docs, and review state together.

Root AGENTS.md instructs future coding agents to follow this workflow. It is a repository convention, not an automatic prose writer or proof of review quality. Build hooks refresh references but deliberately do not acknowledge guide reviews.

## Tooling boundaries

The source scanner is explicit and offline. It does not introspect a running server/database, infer inherited DTO semantics, execute decorators, validate remote URLs, or infer component provider correctness. Generated member tables are syntactic indexes; the feature guides explain inherited validation and runtime behavior. Local Markdown link validation checks file existence, not heading anchors.

When new source roots, non-text assets with behavioral meaning, migration folders outside src, or new config files are introduced, add them to scripts/docs.mjs scanning and the manifest. The workflow and generator themselves are mapped to the tooling guide for review. Backend dependency installation is needed even when generating frontend references because the generator uses that TypeScript parser.

Do not manually edit generated files. Do not include secrets in source or public examples; the scanner's exclusions cannot sanitize a secret mistakenly committed inside a source file.

The root backend:dev, admin:dev, and shop:dev commands automatically start a documentation watcher alongside the application. Stop the terminal command with Ctrl+C when finished. Direct per-app start commands do not start that watcher.
