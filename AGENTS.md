# Repository documentation requirements

When changing any feature, update its documentation in the same task.

- Read docs/README.md and the relevant backend/frontend feature guides before editing.
- Document actual behavior. Clearly label placeholders, missing layers, and known limitations.
- Update table structure, DTO rules, service methods, controller/API contracts, frontend state/routes, and design rationale where affected.
- New features need a dedicated guide and ownership in docs/manifest.json; new source roots/configuration need scanner coverage.
- Run npm run docs:generate after source changes. Never hand-edit generated references.
- Review the affected guides, then run npm run docs:review -- <group-id> for each reviewed group. Do not acknowledge a review without reading/updating its docs.
- Run npm run docs:check and appropriate feature tests before finishing.
- Include changed authored docs, generated references, and docs/review-state.json with the feature change.
- Never publish real environment secrets, passwords, tokens, or private user data in docs.
- Do not fix unrelated application behavior during documentation-only work; record observed limitations accurately.
