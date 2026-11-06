# Club Passport Promotions: Mobile Spec

API requirements, OpenAPI spec, and UX/UI design for the mobile promotions listing, promotion detail, and in-app reward claiming.

## Contents

| Path | What it is |
| --- | --- |
| [`docs/api-requirements.md`](docs/api-requirements.md) | What the app needs from the API: field mapping, new fields with priorities, claim endpoint, data issues, UI fallbacks, open questions |
| [`api/promotions-api.openapi.yaml`](api/promotions-api.openapi.yaml) | Proposed v2.1 OpenAPI 3.1 spec. New fields are tagged `x-new: true` |
| [`api/examples/`](api/examples) | Sample promotions response and claim responses (success and each error) |
| [`design/`](design) | Browser preview of every screen ([`design/index.html`](design/index.html)), screen list, and source |

## Design preview

Enable GitHub Pages (Settings → Pages → Deploy from a branch → `main`, `/ (root)`) and open the site; it redirects to the screen gallery. Or run `python3 -m http.server 8000` in the repo root and open http://localhost:8000/.

## Status

Proposed. Field names, the claim endpoint path, and error codes need backend sign-off. See the open questions at the end of the requirements doc.

## Validating the spec

```bash
pip install openapi-spec-validator
openapi-spec-validator api/promotions-api.openapi.yaml
```

The examples validate against the schemas in the spec.
