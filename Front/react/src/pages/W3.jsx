import "../styles/W3.css"
import { use, useEffect, useState, useMemo } from "react"
import { useParams } from "react-router-dom"
import Card from "react-bootstrap/Card"
import Form from "react-bootstrap/Form"
import Alert from "react-bootstrap/Alert"
import { UserContext } from "../data/context.js"
import { FilterOption, HttpMethod } from "../data/enums.js"
import rememberPage from "../modules/rememberPage.js"
import Fetch from "../API/Fetch.js"
import MainComponents from "./components/MainComponents/MainComponents.jsx"
import ScrollToTopOrBottom from "./components/MainComponents/components/ScrollToTopOrBottom.jsx"
import Loading from "./components/Loading.jsx"
import Button from "./components/UI/Button.jsx"
import { CacheKeys } from "../data/enums.js"
import ethereumIcon from "../images/ethereum-eth.svg"
import arrowRightIcon from "../images/icon-arrow-right.svg"

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
    var [gas, setGas] = useState(null)
    var [errors, setErrors] = useState([])
    var [visible, setIsVisible] = useState(false)

    var showErrors = useMemo(() => {
        if (errors.length > 0) {
            return (errors.map((error) => (
                <Alert key={error} variant="warning">
                    {error}
                </Alert>
            ))
        )
    }
    }, [errors])

    async function getEthereumBalance() {
        setLoading(true)

        var ethCached = JSON.parse(localStorage.getItem(CacheKeys.ETH))
        if (ethCached !== null) {
            setEth({ ...ethCached })
        } else {
            var data = await Fetch({ action: "api/v2/ethereum_balance/", method: HttpMethod.GET })
            if (data && data.ok) {
                setEth({ ...data.data })
                localStorage.setItem(CacheKeys.ETH, JSON.stringify(data.data))
            } else if (data.error) {
                setErrors([...errors, data.error])
    
                setIsVisible(true)
                setTimeout(function() {
                    setIsVisible(false)
                }, 5000)
            }
        }   
        setLoading(false)
    }

    async function getTransactions() {
        setLoading(true)
        var data = await Fetch({ action: "api/v2/get_transactions/", method: HttpMethod.GET })
        if (data && data.ok) {
            setTransactions([ ...data.transactions ])
        } else if (data.error) {
            setErrors([...errors, data.error])

            setIsVisible(true)
            setTimeout(function() {
                setIsVisible(false)
            }, 5000)
        }
        setLoading(false)
    }

    async function sendEth(e) {
        e.preventDefault()
        setLoading(true)

        if (friendId !== -1) {
            var ethValueInt = parseInt(ethValue)
            var body = { private_key: privateKey, recipient_id: friendId, amount_in_eth: ethValueInt, gas: gas }

            var data = await Fetch({ action: "api/v2/send_ethereum/", method: HttpMethod.POST, body: body })
            if (data && data.ok) {
                setTransactions([ data.transaction, ...transactions ])
            } else if (data.error) {
                setErrors([...errors, data.error])

                setIsVisible(true)
                setTimeout(function() {
                    setIsVisible(false)
                }, 5000)
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
            <Card className="TransactionCard text-center align-items-center" style={{ width: "100%" }}>
                <Card.Body>
                    Transaction
                </Card.Body>
                <Card.Text>
                    <strong>{transaction.sender.username}</strong> <img src={arrowRightIcon} width="20px" /> <strong>{transaction.recipient.username}</strong> 
                    <br />
                    <strong>ETH:</strong> {transaction.value}
                    <br />
                    <strong>Time:</strong> {transaction.timestamp}
                    <br />
                    <strong>Tx hash:</strong> {transaction.tx_hash}
                    <br />
                    <strong>Receipt:</strong> {transaction.receipt}
                    <br />
                    <strong>Current balance:</strong> {transaction.current_balance}
                    <br />
                    <strong>Gas price:</strong> {transaction.gas_price}
                    <br />
                    <strong>Gas:</strong> {transaction.gas}
                </Card.Text>
            </Card>
        )
    }, [transactions])

    var showFriends = useMemo(() => {
        return friends.map((friend) =>
            <>
                <option key={friend.id} value={friend.id}>{friend.username}</option>
            </>
        )
    }, [friends])

    function clearEthCache() {
        localStorage.removeItem(CacheKeys.ETH)
        setEth({ balance: null, balance_usd: null, usd: null })
        getEthereumBalance()
    }

    useEffect(() => {
        getEthereumBalance()
        getTransactions()
        getFriends()
    }, [])

    return (
        <div class="W3">
            <MainComponents loading={loading} />

            {visible && showErrors}

            <Card className="W3Card text-center align-items-center" style={{ width: "100%" }}>
                <Card.Img variant="top" src={ethereumIcon} style={{ width: "40px" }} />
                <Card.Body>
                    <Card.Title>Ethereum</Card.Title>
                    <Card.Text>
                        Address: <strong>
                            <a href={`https://etherscan.io/address/${user.ethereum_address}`}>
                                {user.ethereum_address}
                            </a>
                        </strong>
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
                    <Card.Text>
                        <Button onClick={() => clearEthCache()} >Clear cache</Button>
                    </Card.Text>
                </Card.Body>
            </Card>

            <Form onSubmit={(e) => sendEth(e)} >
                <Form.Control
                    key="form gas"
                    type="number"
                    value={gas}
                    placeholder="Enter GAS value"
                    onChange={e => setGas(e.target.value)}
                    required
                />
                <br />
                <Form.Control
                    key="form privateKey"
                    type="password"
                    value={privateKey}
                    placeholder="Enter your private key"
                    onChange={e => setPrivateKey(e.target.value)}
                    required
                />
                <br />
                <Form.Control
                    key="form ethValue"
                    type="number"
                    value={ethValue}
                    placeholder="Enter ETH value"
                    onChange={e => setEthValue(e.target.value)}
                    required
                />
                <br />
                <Form.Select
                    key="form friendId"
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
                    Send ETH
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