// Селектор
var $$ = Dom7;

// Инициализация приложения
var myApp = new Framework7({
    animateNavBackIcon: false,
    material: true,
    materialRipple: false,
    onPageInit: function (app, page) {
        if (page.name === 'index') {
            // Список последних элементов
            getLastItems(page, true);
        }
    }
});

// Создать основное представление
var mainView = myApp.addView('.view-main', {
    // Enable dynamic Navbar
    dynamicNavbar: false,
    // Enable Dom Cache so we can use all inline pages
    domCache: false
});

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
    }
});

myApp.onPageInit('item', function (page) {
    checkBackHistory();
});

myApp.onPageAfterAnimation('item', function (page) {
    // Отобразить элемент
    getItem(page.query.itemId, page);
});

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
        },
        function (xhr) {
            if (xhr.status === 403) {
                var result = JSON.parse(xhr.response);
                if (result) {
                    // Показать окно авторизации
                    myApp.loginScreen();
                }
            }
        });
        /*
        $$.get('js/categories.json', function (data) {
            categories = JSON.parse(data);
            localStorage.setItem('categories', JSON.stringify(categories));
            renderCategories(categories);
        });
        */
    }
    else {
        renderCategories(categories);
    }
}

function renderCategories(categories) { 
    var itemsHTML = '';
    for (var i = 0; i < categories.length; i++) {
        itemsHTML +=
        '<li>' +
        '   <a href="category.html?categoryId=' + categories[i].id + '" class="item-link item-content close-panel">' +
        '       <div class="item-inner">' +
        '           <div class="item-title">' + categories[i].title + '</div>' +
        '       </div>' +
        '   </a>' +
        '</li>';
    }
    $$('.categories').html('<ul>' + itemsHTML + '</ul>');
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
        /*
        $$.get('js/items.json', function (data) {
            data = JSON.parse(data);

            // В рабочей версии убрать (!)
            for (var i = 0; i <= 8; i++) {
                items.push(data[i]);
            }

            localStorage.setItem('lastitems', JSON.stringify(items));
            renderLastItems(items, page);
        });
        */
    }
    else {
        renderLastItems(items, page);
    }    
}

function renderLastItems(items, page) {
    var images = ['img/city-q-c-1000-600-9.jpg', 'img/nature-q-c-1000-600-3.jpg', 'img/people-q-c-1000-600-9.jpg'], 
        firstItemHTML = '', itemsHTML = '';

    for (var i = 0; i < items.length; i++) {
        // 1-й элемент отдельно
        if (i === 0) {
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
    $$(page.container).find('.first-item').html(firstItemHTML);
    // Показать список 
    $$(page.container).find('.last-items').html(itemsHTML); 
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
        /*
        $$.get('js/items.json', function (data) {
            data = JSON.parse(data);

            // В рабочей версии убрать (!)
            for (var i = 0; i < data.length; i++) {
                if (data[i].category === category.id) items.push(data[i]);
            }

            localStorage.setItem(storagekey, JSON.stringify(items));
            renderItems(items, page);
        });
        */
    }
    else {
        renderItems(items, page);
    }    
}

function renderItems(items, page) {
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
    $$(page.container).find('.items').html(itemsHTML); 
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
        /*
        $$.get('js/items.json', function (data) {
            data = JSON.parse(data);

            // В рабочей версии убрать (!)
            for (var i = 0; i < data.length; i++) {
                if (data[i].id === itemId) {
                    item = data[i];
                    break;
                };
            }

            localStorage.setItem(storagekey, JSON.stringify(item));
            renderItem(item, page);
        });
        */
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
    Авторизация 
*/
var loginscreen = $$('.login-screen');
loginscreen.find('.button-big').on('click', function () {
    var iin = loginscreen.find('input[name="iin"]').val();
    var datein = loginscreen.find('input[name="datein"]').val();
    // Это надо перенести в intraapi, исправить (!)
    $$.ajax({
        url: intraapi.url + 'auth',
        method: 'POST',
        beforeSend: function () {
            // Индикатор процесса авторизации
            myApp.showPreloader('Проверка данных...');
        },
        data: 'iin=' + iin + '&' + 'datein=' + datein,
        success: function (data) {
            data = JSON.parse(data);
            if (data && data.auth === true) {
                // Сохранить подпись
                localStorage.setItem('sign', data.sign);
                // Обновить список 
                getCategories(true);
                // Закрыть окно авторизации
                myApp.closeModal('.login-screen');
                // Обновить список последних элементов
                getLastItems(mainView.activePage, true);
            }
            else {
                $$('.error').text('Ошибка авторизации!');
            }
            myApp.hidePreloader();
        },
        error: function (xhr) {
            $$('.error').text('Сеть или сервер авторизации вне доступа!');
            myApp.hidePreloader();
        }
    });
});

function findCategory(categoryId) {
    var categories = JSON.parse(localStorage.getItem('categories')) || [];
    for (var i = 0; i < categories.length; i++) {
        if (categories[i].id === categoryId) return categories[i];
    }
}

// Загрузить категории
getCategories(true);