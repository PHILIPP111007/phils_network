import "./styles/App.css"
import "./styles/theme.css"
import { Suspense, useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthContext, UserContext, ThemeContext } from "./data/context"
import { PrivateRoutes, PublicRoutes } from "./data/routes"
import { useAuth } from "./hooks/useAuth"
import SuspenseLoading from "./pages/components/SuspenseLoading"
import Error from "./pages/Error/Error"

export default function App() {

    const [isAuth, setIsAuth] = useState(false)
    const [user, setUser] = useState({})
    const [theme, setTheme] = useState("light") // "light" or "dark"
    const html = document.getElementsByTagName("html")[0]

    useEffect(() => {
        const newTheme = localStorage.getItem("theme")
        if (newTheme !== null && newTheme !== theme) {
            setTheme(newTheme)
            html.className = newTheme
        } else {
            html.className = theme
        }
    }, [theme])

    useAuth({ username: user.username, setIsAuth: setIsAuth })

    return (
        <AuthContext.Provider value={{ isAuth, setIsAuth }}>
            <UserContext.Provider value={{ user, setUser }}>
                <ThemeContext.Provider value={{ theme, setTheme }}>
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
                </ThemeContext.Provider>
            </UserContext.Provider>
        </AuthContext.Provider>
    )
}