(function (Framework7, $$) {
    'use strict';

    var url = 'https://web.applecity.kz:3381/',     // адрес сервера
        apiPath = 'mobileintra/hs/api/',            // адрес API
        rcount = 2,                                 // кол-во попыток загрузки данных
        req, reqPOST, intraapi;

    req = function (path, success, error, retry) {
        if (retry === undefined) retry = rcount;
        return $$.ajax({
            url: url + apiPath + path + '?sign=' + localStorage.getItem('sign'), /* подписать запрос */
            success: success,
            error: function (xhr) {
                if (retry > 0 && !(xhr.status === 403 && xhr.statusText === 'Forbidden')) {
                    req(path, success, error, retry -= 1);
                } else {
                    error(xhr);
                }
            }
        });
    };

    reqPOST = function (path, data, success, error, retry) {
        if (retry === undefined) retry = rcount;
        return $$.ajax({
            url: url + apiPath + path,
            method: 'POST',
            data: data,
            success: success,
            error: function (xhr) {
                if (retry > 0 && !(xhr.status === 403 && xhr.statusText === 'Forbidden')) {
                    reqPOST(path, data, success, error, retry - 1);
                } else {
                    error(xhr);
                }
            }
        })
    };

    intraapi = {

        url: url,

        // Загрузка категорий
        loadCategories: function (success, error) {
            return req('categories', success, error);
        },

        // Загрузка последних статей
        loadTopArticles: function (lastLoadedIndex, success, error) {
            if (!lastLoadedIndex) lastLoadedIndex = 0;
            return req('toparticles/' + lastLoadedIndex, success, error);
        },

        // Загрузка статей по категории
        loadArticles: function (categoryId, lastLoadedIndex, success, error) {
            if (!lastLoadedIndex) lastLoadedIndex = 0;
            return req('articles/' + categoryId + '/' + lastLoadedIndex, success, error);
        },

        // Загрузка статьи
        loadArticle: function (articleId, success, error) {
            return req('article/' + articleId, success, error);
        },

        // Авторизация
        checkAuth: function (data, success, error) {
            return reqPOST('auth/', data, success, error);
        }
    };

    window.intraapi = intraapi;

} (Framework7, Dom7));
