import "./styles/App.css"
import "./styles/theme.css"
import { Suspense, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthContext, UserContext } from "./data/context"
import { PrivateRoutes, PublicRoutes } from "./data/routes"
import { Theme } from "./data/enums"
import { useAuth } from "./hooks/useAuth"
import SuspenseLoading from "./pages/components/SuspenseLoading"
import Error from "./pages/Error/Error"

export default function App() {

    const body = document.getElementsByTagName("body")[0]
    if (localStorage.getItem(Theme.NAME) !== undefined) {
        body.className = localStorage.getItem(Theme.NAME)
    } else {
        body.className = Theme.LIGHT
    }
    const [isAuth, setIsAuth] = useState(false)
    const [user, setUser] = useState({})

    useAuth({ username: user.username, setIsAuth: setIsAuth })

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
                                        errorElement={<Error />}
                                        element={isAuth ? route.element : <Navigate replace to="/login/" />}
                                        exact
                                    />
                                )}

                                {PublicRoutes.map((route) =>
                                    <Route
                                        key={route.path}
                                        path={route.path}
                                        errorElement={<Error />}
                                        element={route.element}
                                        exact
                                    />
                                )}
                                <Route path="*" element={<Error />} />
                            </Routes>
                        </Suspense>
                    </div>
                </BrowserRouter>
            </UserContext.Provider>
        </AuthContext.Provider>
    )
}