import { elementInfo, type Molecule } from "@/lib/chemistry";

export function createAtomMolecule(symbol: string): Molecule {
    const normalized = symbol.trim();
    const info = elementInfo(normalized);

    return {
        id: `atom-${normalized.toLowerCase()}`,
        formula: normalized,
        name: info.name,
        description: `Single atom of ${info.name}`,
        category: "element",
        atoms: [{ el: normalized, x: 0, y: 0, z: 0 }],
        bonds: [],
    };
}

export function resolveLabSpawn(
    molecules: Molecule[],
    spawnParam?: string | null,
    elementParam?: string | null,
): Molecule | null {
    const elementSymbol = elementParam?.trim();
    if (elementSymbol) {
        return createAtomMolecule(elementSymbol);
    }

    const spawnValue = spawnParam?.trim();
    if (!spawnValue || molecules.length === 0) return null;

    const tokens = spawnValue
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);

    const exactMatch = molecules.find(
        (m) => tokens.includes(m.formula) || tokens.includes(m.id),
    );
    if (exactMatch) return exactMatch;

    const partialMatch = molecules.find((m) =>
        tokens.some((token) => m.formula.includes(token)),
    );
    if (partialMatch) return partialMatch;

    if (tokens.length === 1) {
        return createAtomMolecule(tokens[0]);
    }

    return null;
}