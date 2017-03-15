// Селектор
var $$ = Dom7;

var myApp, mainView, loginScreen;

// Инициализация приложения
myApp = new Framework7({
    animateNavBackIcon: false,
    material: true,
    materialRipple: false,
    onPageInit: function (app, page) {
        if (page.name === 'index') {
            // Список последних элементов
            getLastItems(page, true);
            // Pull to refresh
            initPullToRefresh(page);
            // Infinite Scroll
            initInfiniteScroll(page);
        }
    }
});

// Основное представление
mainView = myApp.addView('.view-main', {
    // Enable dynamic Navbar
    dynamicNavbar: false,
    // Enable Dom Cache so we can use all inline pages
    domCache: false
});

// Диалог авторизации
loginScreen = $$('.login-screen');

myApp.onPageInit('category', function (page) {

    checkBackHistory();

    // Получить параметр из запроса
    var categoryId = page.query.categoryId,
        category = findCategory(categoryId);

    if (category) {
        // Установить заголовок
        $$(myApp.device.ios ? page.navbarInnerContainer : page.container).find('.center').text(category.title);
        // Установить заголовок
        $$(page.container).find('.content-block-title').text('Статьи в категории ' + category.title);
    }
});

myApp.onPageAfterAnimation('category', function (page) {
    // Получить параметр из запроса
    var categoryId = page.query.categoryId,
        category = findCategory(categoryId);

    if (category) {
        // Список элементов категории
        getItems(category, page);
        // Infinite Scroll
        initCategoryInfiniteScroll(page);
    }
});

myApp.onPageInit('item', function (page) {
    checkBackHistory();
});

myApp.onPageAfterAnimation('item', function (page) {
    // Отобразить элемент
    getItem(page.query.itemId, page);
});

var handleRetry;

function getCategories(refresh) {
    var categories = refresh ? [] : JSON.parse(localStorage.getItem('categories')) || [];
    if (categories.length === 0) {
        intraapi.loadCategories(function (data) {
            // Результат  
            categories = JSON.parse(data)['#value'];
            // Обновить кэш
            localStorage.setItem('categories', JSON.stringify(categories));
            // Показать категории
            renderCategories(categories);
            // Остановить проверку с интервалом
            if (handleRetry) clearInterval(handleRetry);
        },
        function (xhr) {
            if (xhr.status === 403) {
                var result = JSON.parse(xhr.response);
                if (result) {
                    // Показать окно авторизации
                    myApp.loginScreen();
                } else {
                    // Сеть не доступна, запустить проверку с интервалом 
                    if (handleRetry === undefined) handleRetry = setInterval(function () {
                        getCategories(true);
                    }, 10000);
                }
            }
        });
    }
    else {
        renderCategories(categories);
    }

    // Обновить список последних элементов
    getLastItems(mainView.activePage, true);
}

var categoryItemHTML = '' + 
    '<li>' +
    '   <a href="" class="item-link item-content close-panel">' +
    '       <div class="item-inner">' +
    '           <div class="item-title"></div>' +
    '       </div>' +
    '   </a>' +
    '</li>';

function renderCategories(categories) { 
    /*
    var itemsHTML = '';
    */
    var ulContainer = $$('ul');
    for (var i = 0; i < categories.length; i++) {
        var item = $$(categoryItemHTML)
            .find('.item-link').attr('href', 'category.html?categoryId=' + categories[i].id)
            .find('.item-title').text(categories[i].title);
        ulContainer.append(item);
        /*
        itemsHTML +=
        '<li>' +
        '   <a href="category.html?categoryId=' + categories[i].id + '" class="item-link item-content close-panel">' +
        '       <div class="item-inner">' +
        '           <div class="item-title">' + categories[i].title + '</div>' +
        '       </div>' +
        '   </a>' +
        '</li>';
        */
    }
    /*
    $$('.categories').html('<ul>' + itemsHTML + '</ul>');
    */
    $$('.categories').append(ulContainer);
}

function getLastItems(page /* для корректного swipeBack */, refresh) {
    var items = refresh ? [] : JSON.parse(localStorage.getItem('lastitems')) || [];
    if (items.length === 0) {
        intraapi.loadTopArticles(1, function (data) {
            // Результат  
            items = JSON.parse(data)['#value'];
            // Обновить кэш
            localStorage.setItem('lastitems', JSON.stringify(items));
            // Показать последние статьи
            renderLastItems(items, page);
        },
        function (xhr) {
            if (xhr.status === 403) {
                // Нет авторизации
            }
        });
    }
    else {
        renderLastItems(items, page);
    }    
}

function renderLastItems(items, page, append) {
    append = append ? append : false;
    var images = ['img/city-q-c-1000-600-9.jpg', 'img/nature-q-c-1000-600-3.jpg', 'img/people-q-c-1000-600-9.jpg'], 
        firstItemHTML = '', itemsHTML = '';

    for (var i = 0; i < items.length; i++) {
        // 1-й элемент отдельно
        if (i === 0 && append === false /* если это не добавление при Infinite Scroll */) {
            firstItemHTML +=
            '<a href="item.html?itemId=' + items[i].id + '&categoryId=' + items[i].catid + '" class="link">' +
            '   <div class="card">' +
            '       <div data-background="' + images[Math.floor(Math.random() * (3 - 0)) + 0] + '" class="lazy lazy-fadeIn card-header-pic"></div>' +
            '       <div class="card-header"><h3>' + items[i].title + '</h3></div>' +
            '       <div class="card-content">' +
            '           <div class="card-content-inner">' +
            '               <p>' + items[i].introtext + '</p>' +
            '               <p class="color-gray">Опубликовано ' + moment().format('LL', items[i].modified) + '</p>' +
            '           </div>' +
            '       </div>' +
            '   </div>' +
            '</a>';
        }
        else {
            itemsHTML +=
            (i % 2 === 1 ? '<div class="row">' : '') + /* по 2 элемента в строке */
            '   <div class="col-50">' + 
            '       <a href="item.html?itemId=' + items[i].id + '&categoryId=' + items[i].catid + '" class="link">' +
            '           <div class="card">' +
            '               <div data-background="' + images[Math.floor(Math.random() * (3 - 0)) + 0] + '" class="lazy lazy-fadeIn card-header-pic"></div>' +
            '               <div class="card-header"><h4>' + items[i].title + '</h4></div>' +
            '               <div class="card-content">' +
            '                   <div class="card-content-inner">' +
            '                       <p class="color-gray">' + moment().format('LL', items[i].modified) + '</p>' +
            '                   </div>' +
            '               </div>' +
            '           </div>' +
            '       </a>' + 
            '   </div>' + 
            (i % 2 === 0 || i === items.length - 1 ? '</div>' : '');
        }
    }

    // Показать 1-й элемент
    if (append === false) $$(page.container).find('.first-item').html(firstItemHTML);
    // Показать список 
    append && append === true ? $$(page.container).find('.last-items').append(itemsHTML) : $$(page.container).find('.last-items').html(itemsHTML); 
    // Показать картинки (lazy load)
    myApp.initImagesLazyLoad(page.container);    
}

function getItems(category, page /* для корректного swipeBack */, refresh) {
    var storagekey = 'items_' + category.id;
    var items = refresh ? [] : JSON.parse(localStorage.getItem(storagekey)) || [];
    if (items.length === 0) {
        intraapi.loadArticles(category.id, 0, function (data) {
            // Результат  
            items = JSON.parse(data)['#value'];
            // Обновить кэш
            localStorage.setItem(storagekey, JSON.stringify(items));
            // Показать категории
            renderItems(items, page);
        },
        function(xhr) {
            
        });
    }
    else {
        renderItems(items, page);
    }

    if (items.length === 0) {
        // Удалить индикатор
        setTimeout(function () {
            $$(page.container).find('.infinite-scroll-preloader').remove();
        }, 1000);
    }
}

function renderItems(items, page, append) {
    var images = ['img/city-q-c-1000-600-9.jpg', 'img/nature-q-c-1000-600-3.jpg', 'img/people-q-c-1000-600-9.jpg'];
    var itemsHTML = '';
    for (var i = 0; i < items.length; i++) {
        itemsHTML +=
        '<a href="item.html?itemId=' + items[i].id + '&categoryId=' + items[i].catid + '" class="link no-ripple">' + 
        '   <div class="card">' + 
        '       <div data-background="' + images[Math.floor(Math.random() * (3 - 0)) + 0] + '" valign="bottom" class="lazy lazy-fadein card-header-pic"></div>' + 
        '       <div class="card-header"><h2>' + items[i].title + '</h2></div>' + 
        '       <div class="card-content">' + 
        '           <div class="card-content-inner">' + 
        '               ' + items[i].introtext + 
        '               <p class="color-gray">Опубликовано ' + moment().format('LL', items[i].modified) + '</p>' + 
        '           </div>' + 
        '       </div>' + 
        '   </div>' + 
        '</a>';
    }

    // Показать список 
    append && append === true ? $$(page.container).find('.items').append(itemsHTML) : $$(page.container).find('.items').html(itemsHTML); 
    // Показать картинки (lazy load)
    myApp.initImagesLazyLoad(page.container);
}

function getItem(itemId, page) {
    var storagekey = 'item_' + itemId;
    var item = JSON.parse(localStorage.getItem(storagekey));
    if (!item) {
        intraapi.loadArticle(itemId, function (data) {
            item = JSON.parse(data)['#value'];
            localStorage.setItem(storagekey, JSON.stringify(item));
            renderItem(item, page);
        },
        function (xhr) {

        });
    }
    else {
        renderItem(item, page);
    }
}

function renderItem(item, page) {
    // Найти категорию элемента
    var category = findCategory(item.catid);
    // Установить переход назад
    $$(myApp.device.ios ? page.navbarInnerContainer : page.container).find('.back-to-category')
    .on('click', function (e) {
        mainView.router.back({
            url: 'category.html?categoryId=' + category.id,
            force: false
        });
    })
    .find('span').text(category.title);

    // Показать элемент 
    $$(page.container).find('.page-content').html(
        '<div class="content-block">' +
        '   <h1>' + item.title + '</h1>' +  
        '   <p class="color-gray">Опубликовано ' + moment().format('LL', item.modified) + '</p>' + 
        '   <p>' + item.introtext + '</p>' + 
            item.fulltext + 
        '</div>'
    ); 
    // Показать картинки (lazy load)
    myApp.initImagesLazyLoad(page.container); 
}

/*
    Свейпбек - это функция iOS, которая позволяет перемещаться на предыдущую страницу, 
    через движение пальцем слева направо. Приложение всегда хранит предыдущие страницы 
    в памяти, для обеспечения этой функции. 
    Большое количество страниц, возможно, расходует много памяти, поэтому сделано 
    ограничение обратных переходов (кроме перехода на основную страницу - оно всегда 
    будет последним).

    Для Материал (Андроид) - это кол-во переходов "Назад". 
*/
var backCount = 5; // кол-во back переходов 
function checkBackHistory() {
    var history = mainView ? mainView.history : [];
    if (history.length > backCount + 1) {
        history.splice(1, 1); // удалить из истории переход, начиная со второго перехода, оставить основную страницу
    }    
}

/*
    Домой
*/
$$('div[data-page="index"] .navbar-inner .center').on('click', function (e) {
    $$('.page-content').scrollTop(0, 500);
});

/*
    Авторизация 
*/
// Индикатор процесса авторизации
var preloader = $$(loginScreen).find('.login-screen-preloader'),
    authInProgress = false; 
// Кнопка авторизации
loginScreen.find('.button-big').on('click', function () {
    if (authInProgress) return;
    authInProgress = true;
    // Очистить ошибки 
    $$(loginScreen).find('.error').text('');
    // Блокировать ввод
    loginScreen.find('input[name="iin"]').attr('disabled', true);
    loginScreen.find('input[name="datein"]').attr('disabled', true);
    // Получить данные
    var authData = $$.serializeObject(myApp.formToJSON(loginScreen.find('form')[0]));
    console.log(authData);
    // Показать индикатор
    preloader.show();
    // Небольшая задержка...
    setTimeout(function () {
        intraapi.checkAuth(authData, function (data) {
            authInProgress = false;
            data = JSON.parse(data);
            if (data && data.auth && data.auth === true) {
                // Сохранить подпись 
                localStorage.setItem('sign', data.sign);
                // Обновить список 
                getCategories(true);
                // Закрыть окно авторизации 
                myApp.closeModal('.login-screen');
            } else {
                $$(loginScreen).find('.error').text('Ошибка авторизации!');
                // Скрыть индикатор
                preloader.hide();
                // Разблокировать ввод
                loginScreen.find('input[name="iin"]').attr('disabled', false);
                loginScreen.find('input[name="datein"]').attr('disabled', false);
            }
        },
        function (xhr) {
            authInProgress = false;
            $$(loginScreen).find('.error').text('Сеть или сервер авторизации вне доступа!');
            // Скрыть индикатор
            preloader.hide();
            // Разблокировать ввод
            loginScreen.find('input[name="iin"]').attr('disabled', false);
            loginScreen.find('input[name="datein"]').attr('disabled', false);
        });
    }, 3000);
});

/*
    Список статей по категории с Infinite Scroll
*/
function initCategoryInfiniteScroll(page) {
    var categoryId = page.query.categoryId,
        category = findCategory(categoryId);
    // Флаг загрузки
    var loading = false;
    // Последний элемент
    var lastLoadedIndex = $$(page.container).find('.infinite-scroll .items a').length + 1;
    // Attach 'infinite' event handler
    $$('.infinite-scroll').on('infinite', function () {
        // Возврат, если загрузка в процессе
        if (loading) return;
        // Установить флаг загрузки
        loading = true;
        // Задержка 2 сек
        setTimeout(function () {
            // Запрос данных
            intraapi.loadArticles(category.id, lastLoadedIndex, function (data) {
                loading = false;
                // Результат  
                items = JSON.parse(data)['#value'];
                if (items.length === 0) {
                    // Nothing more to load, detach infinite scroll events to prevent unnecessary loadings
                    myApp.detachInfiniteScroll($$(page.container).find('.infinite-scroll'));
                    // Удалить индикатор
                    $$(page.container).find('.infinite-scroll-preloader').remove();
                }
                else {
                    // Показать категории
                    renderItems(items, page, true);
                    // Обновить последний элемент
                    lastLoadedIndex = $$(page.container).find('.infinite-scroll .items a').length;
                }
            },
            function (xhr) {

            });
        }, 2000);
    });
}

/*
    Список последних статей с Pull to refresh
*/
function initPullToRefresh(page) {
    var ptrContent = $$(page.container).find('.pull-to-refresh-content');
    ptrContent.on('refresh', function (e) {
        // Задержка 2 сек
        setTimeout(function () {
            // Обновить (по-хорошему, стоило бы добавлять, а не заново все перегружать)
            getLastItems(page, true);
            // Завершить
            myApp.pullToRefreshDone();
        }, 2000);
    });
}

/*
    Список последних статей с Infinite Scroll
*/
function initInfiniteScroll(page) {
    // Флаг загрузки
    var loading = false;
    // Последний элемент
    var lastLoadedIndex = $$(page.container).find('.infinite-scroll .last-items a').length + 1;
    // Attach 'infinite' event handler
    $$('.infinite-scroll').on('infinite', function () {
        // Возврат, если загрузка в процессе
        if (loading) return;
        // Установить флаг загрузки
        loading = true;
        // Задержка 2 сек
        setTimeout(function () {
            // Запрос данных
            intraapi.loadTopArticles(lastLoadedIndex, function (data) {
                loading = false;
                // Результат  
                items = JSON.parse(data)['#value'];
                if (items.length === 0) {
                    // Nothing more to load, detach infinite scroll events to prevent unnecessary loadings
                    myApp.detachInfiniteScroll($$(page.container).find('.infinite-scroll'));
                    // Удалить индикатор
                    $$(page.container).find('.infinite-scroll-preloader').remove();
                }
                else {
                    // Показать категории
                    renderLastItems(items, page, true);
                    // Обновить последний элемент
                    lastLoadedIndex = $$(page.container).find('.infinite-scroll .last-items a').length;
                }
            },
            function (xhr) {

            });
        }, 2000);
    });
}

function findCategory(categoryId) {
    var categories = JSON.parse(localStorage.getItem('categories')) || [];
    for (var i = 0; i < categories.length; i++) {
        if (categories[i].id === categoryId) return categories[i];
    }
}

// Загрузить категории
getCategories(true);

