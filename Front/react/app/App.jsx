import "./styles/App.css"
import "bootstrap/dist/css/bootstrap.min.css"
import "./styles/theme.css"
import { Suspense, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthContext, UserContext } from "./data/context.js"
import { PrivateRoutes, PublicRoutes } from "./data/routes.jsx"
import { useAuth } from "./hooks/useAuth.js"
import useLanguage from "./hooks/useLanguage.js"
import useTheme from "./hooks/useTheme.js"
import SuspenseLoading from "./pages/components/SuspenseLoading.jsx"
import ErrorPage from "./pages/ErrorPage/ErrorPage.jsx"

export default function App() {

    useTheme()

    var [isAuth, setIsAuth] = useState(false)
    var [user, setUser] = useState({
        id: 0,
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        is_online: false,
        image: null,
        ethereum_address: null,
        infura_api_key: null,
    })

    useAuth({ username: user.username, setIsAuth: setIsAuth })

    useLanguage()

    return (
        <AuthContext.Provider value={{ isAuth, setIsAuth }}>
            <UserContext.Provider value={{ user, setUser }}>
                <BrowserRouter>
                    <div className="App">
                        <Toaster />
                        <Suspense fallback={<SuspenseLoading />}>
                            <Routes>
                                {PrivateRoutes.map((route) =>
                                    <Route
                                        key={route.path}
                                        path={route.path}
                                        errorElement={<ErrorPage />}
                                        element={isAuth ? route.element : <Navigate replace to="/login/" />}
                                        exact
                                    />
                                )}

                                {PublicRoutes.map((route) =>
                                    <Route
                                        key={route.path}
                                        path={route.path}
                                        errorElement={<ErrorPage />}
                                        element={route.element}
                                        exact
                                    />
                                )}
                                <Route path="*" element={<ErrorPage />} />
                            </Routes>
                        </Suspense>
                        <div className="BottomDiv"></div>
                    </div>
                </BrowserRouter>
            </UserContext.Provider>
        </AuthContext.Provider>
    )
}
