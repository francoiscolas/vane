var camelize = module.exports = function (string) {
    return string.replace(/(?:^|_|-)+(.)?/g, function(match, chr) {
        return chr ? chr.toUpperCase() : '';
    });
};
