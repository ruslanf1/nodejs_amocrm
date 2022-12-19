import fetch from "node-fetch"
import {config} from "./config.js"
import {amoScript} from "./auth.js"

// Получение контактов.
let page = 1
async function getContact(token) {
    try {
        const response = await fetch(config.url + config.urlContact + page, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + token}
        })
        if (response.status === 200) {
            const data = await response.json()
            checkTasksForContacts(data, token)
            page++
        }
        if (response.status === 204) console.log('Задачи добавлены.')
    } catch (e) {
        console.log(e.message)
    }
}

// Собираем контакты без сделок в массив. Запрашиваем в амо задачи с текстом "Контакт без сделок".
// Если таких нет, идем дальше. Если есть собираем id контактов, к которым привязаны эти задачи, в массив.
// Сравниваем массивы и составляем массив id контактов у которых нет сделок и нет задач с текстом "Контакт без сделок".
async function checkTasksForContacts(data, token) {
    try {
        const contactId = data._embedded.contacts
            .map(element => {
                if (Object.keys(element._embedded.leads).length !== 0) return element.id
            })
            .filter(element => element !== undefined)

        const response = await fetch(config.url + config.urlCheckTasks, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + token}
        })

        if (response.status === 204) {
            sendAmoTasks(contactId, token)
        }
        if (response.status === 200) {
            const contactTask = await response.json()
            const contactIdTask = contactTask._embedded.tasks.map(element => {
                return element.entity_id
            })
            let difference = contactId.filter(x => !contactIdTask.includes(x));
            sendAmoTasks(difference, token)
        }
    } catch (e) {
        console.log(e.message)
    }
}

// Собираем задачи в пакет и отправляем в амо. Запускаем скрипт заново для другой страницы.
async function sendAmoTasks(contactId, token) {
    try {
        const tasks = contactId.map(element => {
            return {
                entity_id: element,
                entity_type: 'contacts',
                text: 'Контакт без сделок',
                complete_till: Math.floor(Date.now() / 1000 + 86400)
            }
        })
        getContact(token)
        await fetch(config.url + config.urlTasks, {
            method: 'POST',
            body: JSON.stringify(tasks),
            headers: {'Authorization': 'Bearer ' + token}
        })
    } catch (error) {
        console.log(error.message)
    }
}

amoScript()

export {getContact}

