import "./styles/App.css"
import "./styles/theme.css"
import { Suspense, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthContext, UserContext } from "./data/context"
import { PrivateRoutes, PublicRoutes } from "./data/routes"
import { useAuth } from "./hooks/useAuth"
import useLanguage from "./hooks/useLanguage"
import useTheme from "./hooks/useTheme"
import SuspenseLoading from "./pages/components/SuspenseLoading"
import ErrorPage from "./pages/ErrorPage/ErrorPage"

export default function App() {

    useTheme()

    var [isAuth, setIsAuth] = useState(false)
    var [user, setUser] = useState({
        id: 0,
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        is_online: false,
    })

    useAuth({ username: user.username, setIsAuth: setIsAuth })

    useLanguage()

    return (
        <AuthContext.Provider value={{ isAuth, setIsAuth }}>
            <UserContext.Provider value={{ user, setUser }}>
                <BrowserRouter>
                    <div className="App">
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