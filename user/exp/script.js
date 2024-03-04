//runs once user is validated
var userData;
function load(user) {
    const permissions = user.permissions.replace(' ', '').split(',');
    userData = user;
    if (permissions.includes('exp')) {
        loadMonth(new Date(), true);
        // loadZoomLink();
    }
    else {
        window.location.href = '/user/'
    }
}