export const getCookie = (cname) => {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
export const setCookie = (cname, value) => {
    document.cookie = cname +'='+ value +'; Path=/;';
}
export const deleteCookie = (cname) => {
    document.cookie = cname +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}