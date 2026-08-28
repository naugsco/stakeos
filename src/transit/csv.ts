/**
 * Minimal RFC 4180 CSV reader for GTFS text files.
 *
 * GTFS files are plain CSV with a header row, but fields such as `stop_name`
 * regularly contain commas inside quotes ("W Georgia St @ Cardero St, Bay 2"),
 * so a `split(",")` is not good enough. This parser handles quoted fields,
 * escaped double quotes, CRLF line endings, and a leading BOM.
 */
export type CsvRow = Record<string, string>;

const stripBom = (value: string) => (value.charCodeAt(0) === 0xfeff ? value.slice(1) : value);

const parseRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n" || char === "\r") {
      // Swallow the \n of a \r\n pair so it does not open an empty row.
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
};

/** Parses GTFS CSV text into header-keyed records, skipping blank lines. */
export const parseCsv = (text: string): CsvRow[] => {
  const rows = parseRows(stripBom(text));
  const header = rows.shift();

  if (!header) {
    return [];
  }

  const columns = header.map((name) => name.trim());

  return rows
    .filter((values) => values.some((value) => value.trim().length > 0))
    .map((values) => {
      const record: CsvRow = {};
      for (let index = 0; index < columns.length; index += 1) {
        record[columns[index]] = (values[index] ?? "").trim();
      }
      return record;
    });
};
