import "./styles/FindUser.css"
import { useState } from "react"
import { CacheKeys, Language } from "../../data/enums.js"
import Button from "./UI/Button.jsx"
import Input from "./UI/Input.jsx"

export default function FindUser(props) {

    var [findUser, setFindUser] = useState({ username: "", first_name: "", last_name: "" })
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
        return (
            <div className="FindUser">
                <Input
                    type="text"
                    className="form-control"
                    placeholder="username"
                    value={findUser.username}
                    onChange={(e) => setFindUser({ ...findUser, username: e.target.value })}
                />
                <br />
                <Input
                    type="text"
                    className="form-control"
                    placeholder="first name"
                    value={findUser.first_name}
                    onChange={(e) => setFindUser({ ...findUser, first_name: e.target.value })}
                />
                <br />
                <Input
                    type="text"
                    className="form-control"
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
                    className="form-control"
                    placeholder="ник"
                    value={findUser.username}
                    onChange={(e) => setFindUser({ ...findUser, username: e.target.value })}
                />
                <br />
                <Input
                    type="text"
                    className="form-control"
                    placeholder="имя"
                    value={findUser.first_name}
                    onChange={(e) => setFindUser({ ...findUser, first_name: e.target.value })}
                />
                <br />
                <Input
                    type="text"
                    className="form-control"
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