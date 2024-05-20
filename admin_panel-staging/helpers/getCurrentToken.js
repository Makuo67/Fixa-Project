import localforage from "localforage";

export const getCurrentToken = async () => {
    let token = "";
    try {
        const tokenBearer = await localforage.getItem("FIXA_ADMIN_PANEL_AUTH_TOKEN")
        token = tokenBearer?.value.split(" ")[1] || ""

    } catch (e) {
        console.log("an error happened when trying to retrieve token", e);
    }
    return token;
}