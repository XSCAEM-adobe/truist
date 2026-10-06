# table

Custom **table** block. Purpose: data-table.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: One block row per table row, one cell per column. Row 1 = column headers (the top-left header cell may be left empty), following rows = data. With 'row-headers' the first cell of every data row becomes a row header. With 'caption' the paragraph typed directly above the block becomes the table caption. Typical use: Table (striped), or Table (striped, row-headers, caption) for comparison tables.

## Supported variations

| Variation | Option class |
| --- | --- |
| Striped rows | `striped` |
| First column as row headers | `row-headers` |
| Caption from the paragraph directly above | `caption` |
| No header row | `no-header` |
| Cell borders | `bordered` |

## Universal Editor fields

N/A (Document Authoring project)
