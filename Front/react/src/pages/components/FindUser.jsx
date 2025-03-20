import "./styles/FindUser.css"
import { useState } from "react"
import { CacheKeys, Language } from "../../data/enums"
import Button from "./UI/Button"
import Input from "./UI/Input"

export default function FindUser(props) {

    var [findUser, setFindUser] = useState({ username: "", first_name: "", last_name: "" })
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
        return (
            <div className="FindUser">
                <Input
                    type="text"
                    placeholder="username"
                    value={findUser.username}
                    onChange={(e) => setFindUser({ ...findUser, username: e.target.value })}
                />
                <br />
                <Input
                    type="text"
                    placeholder="first name"
                    value={findUser.first_name}
                    onChange={(e) => setFindUser({ ...findUser, first_name: e.target.value })}
                />
                <br />
                <Input
                    type="text"
                    placeholder="last name"
                    value={findUser.last_name}
                    onChange={(e) => setFindUser({ ...findUser, last_name: e.target.value })}
                />
                <br />
                <Button onClick={() => props.findFunc(findUser)} >find</Button>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="FindUser">
                <Input
                    type="text"
                    placeholder="ник"
                    value={findUser.username}
                    onChange={(e) => setFindUser({ ...findUser, username: e.target.value })}
                />
                <br />
                <Input
                    type="text"
                    placeholder="имя"
                    value={findUser.first_name}
                    onChange={(e) => setFindUser({ ...findUser, first_name: e.target.value })}
                />
                <br />
                <Input
                    type="text"
                    placeholder="фамилия"
                    value={findUser.last_name}
                    onChange={(e) => setFindUser({ ...findUser, last_name: e.target.value })}
                />
                <br />
                <Button onClick={() => props.findFunc(findUser)} >найти</Button>
            </div>
        )
    }
}