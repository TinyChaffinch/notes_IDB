//Создание констант
const list = document.querySelector('ul');
const titleInput = document.querySelector('#title');
const bodyInput = document.querySelector('#body');
const form = document.querySelector('form');
const submitBtn = document.querySelector('form button');

let db;

//Загрузка базы данных при загрузке страницы
let request = window.indexedDB.open('notes', 1);

request.onerror = function () {
    console.log('Database failed to open');
};

request.onsuccess = function () {
    console.log('Database opened successfully');
    db = request.result;
    displayData();
};

//Настройка БД, если она ещё не создана
request.onupgradeneeded = function (e) {
    db = e.target.result;
    let objectStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });

    objectStore.createIndex('title', 'title', { unique: false });
    objectStore.createIndex('body', 'body', { unique: false });

    console.log('Database setup complete');
};

form.onsubmit = addData;

//Функция добавления новой заметки
function addData(e) {
    e.preventDefault();

    let newItem = { title: titleInput.value, body: bodyInput.value };
    let transaction = db.transaction(['notes'], 'readwrite');
    let objectStore = transaction.objectStore('notes');
    var request = objectStore.add(newItem);

    request.onsuccess = function () {
        titleInput.value = '';
        bodyInput.value = '';
    };

    transaction.oncomplete = function () {
        console.log('Транзакция успешна: база обновлена.');
        displayData();
    };

    transaction.onerror = function () {
        console.log('Ошибка транзакции');
    };
}

//Функция отображения заметок
function displayData() {
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    let objectStore = db.transaction('notes').objectStore('notes');
    objectStore.openCursor().onsuccess = function (e) {
        let cursor = e.target.result;

        if (cursor) {
            let listItem = document.createElement('li');
            let h3 = document.createElement('h3');
            let para = document.createElement('p');
            listItem.appendChild(h3);
            listItem.appendChild(para);
            list.appendChild(listItem);

            h3.textContent = cursor.value.title;
            para.textContent = cursor.value.body;

            listItem.setAttribute('data-note-id', cursor.value.id);

            let deleteBtn = document.createElement('button');
            listItem.appendChild(deleteBtn);
            deleteBtn.textContent = 'Удалить';

            deleteBtn.onclick = function (e) {
                deleteItem(e);
            };

            cursor.continue();
        } else {
            if (!list.firstChild) {
                let listItem = document.createElement('li');
                listItem.textContent = 'Заметок нет'
                list.appendChild(listItem);
            }

            console.log('Все заметки отображены');
        }
    };
}

//Функция удаления заметки
function deleteItem(e) {
    let noteId = Number(e.target.parentNode.getAttribute('data-note-id'));

    let transaction = db.transaction(['notes'], 'readwrite');
    let objectStore = transaction.objectStore('notes');
    let request = objectStore.delete(noteId);

    transaction.oncomplete = function () {
        e.target.parentNode.parentNode.removeChild(e.target.parentNode);
        console.log('Note ' + noteId + ' deleted.');

        if (!list.firstChild) {
            let listItem = document.createElement('li');
            listItem.textContent = 'Заметок нет';
            list.appendChild(listItem);
        }
    };
}