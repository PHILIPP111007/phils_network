import "../styles/W3.css"
import { use, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Card from "react-bootstrap/Card"
import { UserContext } from "../data/context.js"
import { HttpMethod } from "../data/enums.js"
import rememberPage from "../modules/rememberPage.js"
import Fetch from "../API/Fetch.js"
import MainComponents from "./components/MainComponents/MainComponents.jsx"
import ScrollToTopOrBottom from "./components/MainComponents/components/ScrollToTopOrBottom.jsx"
import ethereumIcon from "../images/ethereum-eth.svg"

export default function W3() {
    var params = useParams()
    rememberPage(`w3/${params.username}`)

    var [loading, setLoading] = useState(true)
    var { user } = use(UserContext)
    var [eth, setEth] = useState({ balance: null, balance_usd: null, usd: null })

    async function getEthereumBalance() {
        setLoading(true)
        var data = await Fetch({ action: `api/v2/ethereum_balance/`, method: HttpMethod.GET })
        if (data && data.ok) {
            setEth({ ...data })
        }
        setLoading(false)
    }

    useEffect(() => {
        getEthereumBalance()
    }, [])

    return (
        <div class="W3">
            <MainComponents loading={loading} />

            <Card className="W3Card text-center align-items-center" style={{ width: "100%" }}>
                <Card.Img variant="top" src={ethereumIcon} style={{ width: "40px" }} />
                <Card.Body>
                    <Card.Title>Ethereum</Card.Title>
                    <Card.Text>
                        Address: <strong>{user.ethereum_address}</strong>
                    </Card.Text>
                    <Card.Text>
                        Balance (ETH): <strong>{eth.balance}</strong>
                    </Card.Text>
                    <Card.Text>
                        Balance (USD): <strong>${eth.balance_usd}</strong>
                    </Card.Text>
                    <Card.Text>
                        USD: <strong>${eth.usd}</strong>
                    </Card.Text>
                </Card.Body>
            </Card>

            <ScrollToTopOrBottom bottom={false} />
        </div>
    )
}