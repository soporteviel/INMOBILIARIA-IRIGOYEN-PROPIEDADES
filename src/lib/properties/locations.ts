const LOCATION_MAX = 160;

export type LocationSpelling = {
  name: string;
  count: number;
};

/** Recorta, une espacios internos y no cambia mayúsculas ni acentos. */
export function collapseLocation(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, LOCATION_MAX);
}

/** Clave de comparación: sin mayúsculas ni tildes. No es el nombre que se guarda. */
export function foldLocation(value: string) {
  return collapseLocation(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("es-AR");
}

function accentCount(value: string) {
  return [...value.normalize("NFD")].filter((char) => /\p{M}/u.test(char)).length;
}

function hasUpper(value: string) {
  return value !== value.toLocaleLowerCase("es-AR");
}

function isAllCaps(value: string) {
  return hasUpper(value) && value === value.toLocaleUpperCase("es-AR");
}

/**
 * Elige una escritura ya guardada. No inventa Title Case ni corrige el nombre.
 * Si hay varias equivalentes, prioriza la más usada, después la que conserva acentos.
 */
export function chooseCanonicalLocation(spellings: readonly LocationSpelling[]) {
  const unique = new Map<string, number>();
  for (const spelling of spellings) {
    const name = collapseLocation(spelling.name);
    if (!name) {
      continue;
    }
    unique.set(name, (unique.get(name) ?? 0) + spelling.count);
  }

  const ranked = [...unique.entries()].sort(([nameA, countA], [nameB, countB]) => {
    if (countA !== countB) {
      return countB - countA;
    }
    const accents = accentCount(nameB) - accentCount(nameA);
    if (accents !== 0) {
      return accents;
    }
    if (isAllCaps(nameA) !== isAllCaps(nameB)) {
      return isAllCaps(nameA) ? 1 : -1;
    }
    if (hasUpper(nameA) !== hasUpper(nameB)) {
      return hasUpper(nameA) ? -1 : 1;
    }
    return nameA.localeCompare(nameB, "es-AR");
  });

  return ranked[0]?.[0] ?? "";
}

export function groupLocationSpellings(values: readonly (string | null | undefined)[]) {
  const groups = new Map<string, Map<string, number>>();
  for (const value of values) {
    const name = collapseLocation(value ?? "");
    if (!name) {
      continue;
    }
    const key = foldLocation(name);
    const spellings = groups.get(key) ?? new Map<string, number>();
    spellings.set(name, (spellings.get(name) ?? 0) + 1);
    groups.set(key, spellings);
  }
  return groups;
}

export function canonicalLocationNames(values: readonly (string | null | undefined)[]) {
  return [...groupLocationSpellings(values).values()]
    .map((spellings) =>
      chooseCanonicalLocation(
        [...spellings.entries()].map(([name, count]) => ({ name, count })),
      ),
    )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es-AR"));
}

/**
 * Si ya hay una ubicación equivalente, devuelve esa escritura.
 * Si no, devuelve el texto ingresado, solo con espacios normalizados.
 *
 * Limitación: no hay unicidad ante altas simultáneas. Dos guardados
 * equivalentes al mismo tiempo pueden persistir dos escrituras, porque la
 * comparación ocurre en la aplicación y no hay una restricción en la base.
 */
export function resolveLocationName(
  incoming: string | null,
  stored: readonly (string | null | undefined)[],
) {
  const collapsed = collapseLocation(incoming ?? "");
  if (!collapsed) {
    return null;
  }
  const key = foldLocation(collapsed);
  const spellings = groupLocationSpellings(stored).get(key);
  if (!spellings) {
    return collapsed;
  }
  return chooseCanonicalLocation(
    [...spellings.entries()].map(([name, count]) => ({ name, count })),
  );
}
