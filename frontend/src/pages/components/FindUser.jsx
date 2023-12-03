import "./styles/FindUser.css"
import { useState } from "react"
import Button from "@pages/components/UI/Button"
import Input from "@pages/components/UI/Input"

export default function FindUser(props) {

    var [findUser, setFindUser] = useState({ username: "", first_name: "", last_name: "" })

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
}