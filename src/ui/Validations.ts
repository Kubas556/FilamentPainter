const hexRegex = /^#(?:[0-9a-fA-F]{3}){2}$/

export const ValidateHEX = (value: string | null | undefined) => {
    if (value === null || value === undefined) return false;

    if (value.length === 0) return false;

    return hexRegex.test(value);
}