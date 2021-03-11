export const clone = (source: object) => {
    return JSON.parse(JSON.stringify(source))
}