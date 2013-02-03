module.exports = {

    tr: function (tag/*, args*/) {
        var i18n = this.controller.application.i18n;
        var lang = this.controller.session.get('locale');
        var name = this.view.name.split('/').pop();

        if (tag[0] === '.')
            tag = this.controller.name + '.' + name + tag;
        return i18n.tr.apply(i18n, [lang, tag].concat(Array.prototype.slice.call(arguments, 1)));
    }

};
