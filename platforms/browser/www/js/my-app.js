// Селектор
var $$ = Dom7;

// Инициализация приложения
var myApp = new Framework7({
    animateNavBackIcon: false,
    material: true,
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
        category = JSON.parse(localStorage.getItem('categories'))[categoryId - 1];

    if (category) {
        // Установить заголовок
        $$(page.navbarInnerContainer).find('.center').text(category.title);
        // Установить заголовок
        $$(page.container).find('.content-block-title').text('Item`s by ' + category.title);
    }
});

myApp.onPageAfterAnimation('category', function (page) {
    // Получить параметр из запроса
    var categoryId = page.query.categoryId,
        category = JSON.parse(localStorage.getItem('categories'))[categoryId - 1];

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
        $$.get('js/categories.json', function (data) {
            categories = JSON.parse(data);
            localStorage.setItem('categories', JSON.stringify(categories));
            renderCategories(categories);
        });
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
        $$.get('js/items.json', function (data) {
            data = JSON.parse(data);

            // В рабочей версии убрать (!)
            for (var i = 0; i <= 8; i++) {
                items.push(data[i]);
            }

            localStorage.setItem('lastitems', JSON.stringify(items));
            renderLastItems(items, page);
        });
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
            '<a href="item.html?itemId=' + items[i].id + '" class="link">' +
            '   <div class="card">' +
            '       <div data-background="' + images[Math.floor(Math.random() * (3 - 0)) + 0] + '" class="lazy lazy-fadeIn card-header-pic"></div>' +
            '       <div class="card-header">' + items[i].title + '</div>' +
            '       <div class="card-content">' +
            '           <div class="card-content-inner">' +
            '               <p>Card with header and footer. Card header is used to display card title and footer for some additional information or for custom actions.</p>' +
            '               <p class="color-gray">Posted on January 21, 2015</p>' +
            '           </div>' +
            '       </div>' +
            '   </div>' +
            '</a>';
        }
        else {
            itemsHTML +=
            (i % 2 === 1 ? '<div class="row">' : '') + /* по 2 элемента в строке */
            '   <div class="col-50">' + 
            '       <a href="item.html?itemId=' + items[i].id + '" class="link">' +
            '           <div class="card">' +
            '               <div data-background="' + images[Math.floor(Math.random() * (3 - 0)) + 0] + '" class="lazy lazy-fadeIn card-header-pic"></div>' +
            '               <div class="card-header">' + items[i].title + '</div>' +
            '               <div class="card-content">' +
            '                   <div class="card-content-inner">' +
            '                       <p class="color-gray">January 21, 2015</p>' +
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
        $$.get('js/items.json', function (data) {
            data = JSON.parse(data);

            // В рабочей версии убрать (!)
            for (var i = 0; i < data.length; i++) {
                if (data[i].category === category.id) items.push(data[i]);
            }

            localStorage.setItem(storagekey, JSON.stringify(items));
            renderItems(items, page);
        });
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
        '<a href="item.html?itemId=' + items[i].id + '" class="link no-ripple">' + 
        '   <div class="card">' + 
        '       <div data-background="' + images[Math.floor(Math.random() * (3 - 0)) + 0] + '" valign="bottom" class="lazy lazy-fadein card-header-pic"></div>' + 
        '       <div class="card-header">' + items[i].title + '</div>' + 
        '       <div class="card-content">' + 
        '           <div class="card-content-inner">' + 
        '               <p>Card with header and footer. Card header is used to display card title and footer for some additional information or for custom actions.</p>' + 
        '               <p class="color-gray">Posted on January 21, 2015</p>' + 
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
    }
    else {
        renderItem(item, page);
    }
}

function renderItem(item, page) {
    // Найти категорию элемента
    var category = undefined;
    var categories = JSON.parse(localStorage.getItem('categories'));
    for (var i = 0; i < categories.length; i++) {
        if (categories[i].id === item.category) {
            category = categories[i];
            break;
        }
    }
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
        '<div class="content-block-title">' + item.title + '</div>' +
        '<div class="content-block">' + 
        '   <p class="color-gray">Posted on January 21, 2015</p>' + 
            item.content + 
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

// Загрузить категории
getCategories(true); 