module.exports = {

    tr: function (tag/*, args*/) {
        var i18n = this.controller.application.i18n;
        var lang = this.controller.session.get('locale');

        if (tag[0] === '.')
            tag = (this.view.name + tag).replace(/\//g, '.');
        return i18n.tr.apply(i18n, [lang, tag].concat(Array.prototype.slice.call(arguments, 1)));
    }

};
