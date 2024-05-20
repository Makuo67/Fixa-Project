export const checkLink = (code) => {
    const regex = /^[A-Za-z0-9+/=]+$/;
    const link = Buffer.from(code, 'base64').toString('ascii');

    try {
        var obj = JSON.parse(link);

        if (code && regex.test(code) && Object.keys(obj).includes('payment_id', 'payee_id')) {
            return obj
        } else {
            return false
        }
    } catch (e) {
        return false
    }
}