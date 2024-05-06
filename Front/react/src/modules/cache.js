import { CacheKeys } from "@data/enums"

export class MessagesByRoomCache {
    static get_key(room_id) {
        return `${CacheKeys.MESSAGES}_${room_id}`
    }
    static get(room_id) {
        var messages_by_room = localStorage.getItem(this.get_key(room_id))
        return JSON.parse(messages_by_room)
    }
    static save(room_id, messages) {
        var msgs_slice = 25
        try {
            localStorage.setItem(this.get_key(room_id), JSON.stringify(messages.slice(-msgs_slice)))
        } catch (e) {
            this.delete()
            console.warn(e)
        }
    }
    static delete(room_id) {
        localStorage.removeItem(this.get_key(room_id))
    }
}

export class RoomsLocalCache {
    static get_key(sender_username) {
        return `${CacheKeys.ROOMS}_${sender_username}` // user.username
    }
    static get(sender_username) {
        return localStorage.getItem(this.get_key(sender_username))
    }
    static save(sender_username, rooms) {
        try {
            localStorage.setItem(this.get_key(sender_username), JSON.stringify(rooms))
        } catch (e) {
            this.delete(sender_username)
            console.warn(e)
        }
    }
    static update(room_id, sender_username, text) {
        var rooms = localStorage.getItem(this.get_key(sender_username))
        if (rooms !== null) {
            rooms = JSON.parse(rooms)
            var current_room = rooms.filter((room) => room.id === room_id)[0] // mainSets.value.room.id
            current_room.last_message_sender = sender_username
            current_room.last_message_text = text
            rooms = [current_room, ...rooms.filter((room) => room.id !== room_id)] // mainSets.value.room.id
            localStorage.setItem(this.get_key(), JSON.stringify(rooms))
        }
    }
    static delete(sender_username) {
        localStorage.removeItem(this.get_key(sender_username))
    }
}