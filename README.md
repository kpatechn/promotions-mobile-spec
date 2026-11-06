# Club Passport Promotions: Mobile Spec

API requirements, OpenAPI spec, and UX/UI design for the mobile promotions listing, promotion detail, and in-app reward claiming.

## Contents

| Path | What it is |
| --- | --- |
| [`docs/api-requirements.md`](docs/api-requirements.md) | What the app needs from the API: field mapping, new fields with priorities, claim endpoint, data issues, UI fallbacks, open questions |
| [`api/promotions-api.openapi.yaml`](api/promotions-api.openapi.yaml) | Proposed v2.1 OpenAPI 3.1 spec. New fields are tagged `x-new: true` |
| [`api/examples/`](api/examples) | Sample promotions response and claim responses (success and each error) |
| [`design/`](design) | Link to the design canvas, screen list, and artboard source |

## Status

Proposed. Field names, the claim endpoint path, and error codes need backend sign-off. See the open questions at the end of the requirements doc.

## Validating the spec

```bash
pip install openapi-spec-validator
openapi-spec-validator api/promotions-api.openapi.yaml
```

The examples validate against the schemas in the spec.
