import fetch from "node-fetch"
import fs from "fs"
import {config} from "./config.js"
import {getContact} from "./index.js"

// Проверка файла с токенами. Проверка времени жизни токена доступа. Получение токена доступа.
async function amoScript() {
    try {
        if (!fs.existsSync('token.txt')) {
            return await auth('code', null)
        }

        const tokens = JSON.parse(fs.readFileSync("token.txt"))

        if (tokens.expires_in <= Math.floor(Date.now() / 1000)) {
            await auth('refresh', tokens.refresh_token)
        }
        await getContact(tokens.access_token)
    } catch (error) {
        console.log(error.message)
    }
}

// Авторизация на амо и получение токенов.
async function auth(type, token) {
    try {
        let body
        if (type === 'code') {
            body = {
                client_id: config.client_id,
                client_secret: config.client_secret,
                grant_type: 'authorization_code',
                code: config.code,
                redirect_uri: config.redirect_uri
            }
        }
        if (type === 'refresh') {
            body = {
                client_id: config.client_id,
                client_secret: config.client_secret,
                grant_type: 'refresh_token',
                refresh_token: token,
                redirect_uri: config.redirect_uri
            }
        }
        const response = await fetch(config.url + config.urlAuth, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        })
        const data = await response.json()
        saveToFile({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in + Math.floor(Date.now() / 1000 + 86400)
        })
        await getContact(data.access_token)
    } catch (e) {
        console.log(e.message)
    }
}

// Сохранение токенов в файл.
function saveToFile(json) {
    try {
        fs.writeFile('./token.txt', JSON.stringify(json), (error) => {
            if (error) throw new Error('Ошибка сохранения данных в файл.')
        });
    } catch (error) {
        console.log(error)
    }
}

export {amoScript}