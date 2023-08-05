import "./styles/App.css"
import "./styles/theme.css"
import { useEffect, useState } from "react"
import { AuthContext, UserContext, ThemeContext } from "./data/context"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { privateRoutes } from "./data/routes"
import Error from "./pages/Error"
import Login from "./pages/Login"
import Register from "./pages/Register"

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

    return (
        <AuthContext.Provider value={{ isAuth, setIsAuth }}>
            <UserContext.Provider value={{ user, setUser }}>
                <ThemeContext.Provider value={{ theme, setTheme }}>
                    <BrowserRouter>
                        <div className="App">
                            <Routes>
                                {privateRoutes.map((route) =>
                                    <Route
                                        key={route.path}
                                        path={route.path}
                                        errorElement={<Error />}
                                        element={isAuth ? route.element : <Navigate replace to="/login/" />}
                                        exact={route.exact}
                                    />
                                )}

                                <Route
                                    path="/"
                                    errorElement={<Error />}
                                    element={<Login />}
                                    exact
                                />

                                <Route
                                    path="/login/"
                                    errorElement={<Error />}
                                    element={<Login />}
                                    exact
                                />

                                <Route
                                    path="/register/"
                                    errorElement={<Error />}
                                    element={<Register />}
                                    exact
                                />

                                <Route path="*" element={<Error />} />
                            </Routes>
                        </div>
                    </BrowserRouter>
                </ThemeContext.Provider>
            </UserContext.Provider>
        </AuthContext.Provider>
    )
}