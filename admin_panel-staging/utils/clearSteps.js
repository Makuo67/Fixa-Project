import localforage from "localforage"

/**
 * Clears the "parentStep" and "childStep" from local storage using localforage.
 *
 * @return {Promise<void>} A promise that resolves when the items are removed from local storage.
 */
export const clearSteps = async () => {
    await localforage.removeItem("parentStep")
    await localforage.removeItem("childStep")
}

/**
 * Clears the entire IndexedDB database.
 *
 * @return {Promise<void>} A promise that resolves once the database is cleared.
 */
export const clearIndexDB = async () => {
    await localforage.clear()
}