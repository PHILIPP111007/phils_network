import "../styles/W3.css"
import { use, useEffect, useState, useMemo } from "react"
import { useParams } from "react-router-dom"
import Card from "react-bootstrap/Card"
import Form from 'react-bootstrap/Form'
import { UserContext } from "../data/context.js"
import { FilterOption, HttpMethod } from "../data/enums.js"
import rememberPage from "../modules/rememberPage.js"
import Fetch from "../API/Fetch.js"
import MainComponents from "./components/MainComponents/MainComponents.jsx"
import ScrollToTopOrBottom from "./components/MainComponents/components/ScrollToTopOrBottom.jsx"
import Loading from "./components/Loading.jsx"
import Button from "./components/UI/Button.jsx"
import ethereumIcon from "../images/ethereum-eth.svg"

export default function W3() {
    var params = useParams()
    rememberPage(`w3/${params.username}`)

    var [loading, setLoading] = useState(true)
    var { user } = use(UserContext)
    var [eth, setEth] = useState({ balance: null, balance_usd: null, usd: null })
    var [transactions, setTransactions] = useState([])
    var [friends, setFriends] = useState([])
    var [ethValue, setEthValue] = useState(null)
    var [privateKey, setPrivateKey] = useState(null)
    var [friendId, setFriendId] = useState(0)

    async function getEthereumBalance() {
        setLoading(true)
        var data = await Fetch({ action: `api/v2/ethereum_balance/`, method: HttpMethod.GET })
        if (data && data.ok) {
            setEth({ ...data })
        }
        setLoading(false)
    }

    async function getTransactions() {
        setLoading(true)
        var data = await Fetch({ action: `api/v2/get_transactions/`, method: HttpMethod.GET })
        if (data && data.ok) {
            setTransactions([ ...data.transactions ])
        }
        setLoading(false)
    }

    async function sendEth(e) {
        e.preventDefault()
        setLoading(true)

        if (friendId !== -1) {
            var ethValueInt = parseInt(ethValue)
            var body = { private_key: privateKey, recipient_id: friendId, amount_in_eth: ethValueInt }

            var data = await Fetch({ action: "api/v2/send_ethereum/", method: HttpMethod.POST, body: body })
            if (data && data.ok) {
                setTransactions([ data.transaction, ...transactions ])
            }
        }

        setFriendId(-1)
        setLoading(false)
    }

    async function getFriends() {
        setLoading(true)

        var data = await Fetch({ action: `api/v2/friends/${FilterOption.FRIENDS}/`, method: HttpMethod.GET })
        if (data && data.ok) {
            setFriends(data.query)
        }
        setLoading(false)
    }

    var showTransactions = useMemo(() => {
        return transactions.map((transaction) =>
            <>
                <Card className="TransactionCard text-center align-items-center" style={{ width: "100%" }}>
                    <Card.Body>
                        Transaction
                    </Card.Body>
                    <Card.Text>
                        <strong>From:</strong> {transaction.sender_id}
                        <br />
                        <strong>To:</strong> {transaction.recipient_id}
                        <br />
                        <strong>ETH:</strong> {transaction.value}
                        <br />
                        <strong>Time:</strong> {transaction.timestamp}
                        <br />
                        <strong>Tx hash:</strong> {transaction.tx_hash}
                        <br />
                        <strong>Receipt:</strong> {transaction.receipt}
                    </Card.Text>
                </Card>
            </>
        )
    }, [transactions])

    var showFriends = useMemo(() => {
        return friends.map((friend) =>
            <>
                <option key={friend.id} value={friend.id}>{friend.username}</option>
            </>
        )
    }, [friends])

    useEffect(() => {
        // getEthereumBalance()
        getTransactions()
        getFriends()
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

            <Form onSubmit={(e) => sendEth(e)} >
                <Form.Control
                    type="text"
                    value={privateKey}
                    placeholder="Enter your private key"
                    onChange={e => setPrivateKey(e.target.value)}
                    required
                />
                <Form.Control
                    type="text"
                    value={ethValue}
                    placeholder="Enter ETH value"
                    onChange={e => setEthValue(e.target.value)}
                    required
                />
                <Form.Select
                    value={friendId}
                    className="FriendsSelect form-select d-inline-block w-auto"
                    name="language"
                    onChange={e => setFriendId(e.target.value)}
                    required
                >
                    <option key={-1} value={-1}>choose friend</option>
                    {showFriends}
                </Form.Select>
                <Button variant="secondary" type="submit">
                    Submit
                </Button>
            </Form>

            <br />
            <br />
            <br />

            {loading && <Loading />}

            {showTransactions}

            <ScrollToTopOrBottom bottom={false} />
        </div>
    )
}