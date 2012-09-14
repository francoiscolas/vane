var underscore = module.exports = function (string) {
    return string.replace(/::/g, '/')
        .replace(/-/g, '_')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .toLowerCase();
};
