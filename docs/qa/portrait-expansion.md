# Character portrait integration checks

## Asset layout

All existing portrait IDs 0–247 and their image files remain unchanged. Four
independent WebP atlases add 68 frames at 448 × 560, loaded when needed:

| IDs | Content | Count |
| --- | --- | ---: |
| 248–267 | Consorts, including the frontier costume at 263 | 20 |
| 268–293 | Thirteen fathers and thirteen brothers | 26 |
| 294–302 | Three princes, each with infant, child and grown portraits | 9 |
| 303–311 | Three princesses, each with infant, child and grown portraits | 9 |
| 312–315 | Two young and two mature emperor portraits | 4 |

Royal IDs are grouped by stage: three infants, three children, three grown
portraits for each sex. New male variant IDs are 26–28; female variants 30–32.
Female variants 26–29 retain their earlier childhood and age-18 appearance.
The six infant portraits complete the already-created child/adult columns.

The packer locates actual transparent gutters instead of assuming equal row
heights. Original source images remain untouched. It proportionally contains
each cutout, preserves alpha and records source/crop information in
`expanded-portrait-sources.json`. Outer crop adjustments exclude a few adjacent
sleeve/book fragments without repainting the art.

## Persistence and allocation

- New relatives receive a saved portrait once; existing relatives retain their
  legacy appearance. Sisters share the same household records.
- The allocator prefers unused faces, then appropriate family backgrounds.
  Five brothers can receive five different portraits.
- Death, reassignment, save/load and household reconciliation preserve faces.
- Royal variants keep the same identity through all three stages and reloads.
- New emperors use their assigned youthful/mature set. Existing emperors keep
  their legacy set; succession and explicit portrait overrides take precedence.
- The developer gallery includes all six emperor pictures and all new royal sets.

## Verification

`node --test tests/*.test.cjs`: **493 passed, 0 failed**, including the latest
pregnancy-prayer and past-life changes merged from main before publication.

Coverage includes royal stage boundaries and save/load, five distinct brothers,
shared sisters' households, death, legacy identities, succession overrides,
allocation before repeating childhood faces, atlas boundaries and lazy loading.
The source manifest contains exactly 68 unique source cells and appended IDs.
RGBA images were decoded and composited on the game's warm background for
visual inspection of crowns, hands, props, silhouettes and growth correspondence.

A local browser run was unavailable: the execution sandbox disallows starting
the browser/server, and connected browser navigation disallows local file URLs.
No browser UI verification is claimed for this local revision.
