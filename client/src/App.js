import './styles/App.css';
import {Redirect, Route, BrowserRouter, Switch} from "react-router-dom";
import SignUpPage from './pages/SignUpPage/SignUpPage'
import SignInPage from "./pages/SignInPage/SignInPage";
import HomePage from "./pages/HomePage/HomePage";
import AdminPage from "./pages/AdminPage/AdminPage"
import Header from "./shared/Header";
import {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import auth from "./shared/auth.js";
import CollectionsPage from "./pages/CollectionsPage/CollectionsPage";
import CollectionPage from "./pages/CollectionPage/CollectionPage";
import ItemPage from "./pages/ItemPage/ItemPage";
import SearchPage from "./pages/Search/SearchPage";


function App() {
    const token = localStorage.getItem("token")
    const theme = useSelector(state => state.theme)
    const dispatch = useDispatch()

    dispatch({ type: "SET_THEME", payload: localStorage.getItem("theme") || "light" })
    dispatch({ type: "SET_LANGUAGE", payload: localStorage.getItem("language") || "rus" })

    useEffect(() => {
        if (token) auth(token, dispatch).then()

        document.body.setAttribute("class", "bg-" + theme)
    }, [token, dispatch, theme])

    const logged = useSelector(state => state.isAuthUser)
    const role = useSelector(state => state.role)

    return logged ? (<BrowserRouter>
                   <Header isLogged={logged} />
                   <Switch>
                       <Route path="/" exact>
                           <HomePage />
                       </Route>
                       <Route path="/collections/:ownerId">
                           <CollectionsPage />
                       </Route>
                       <Route path="/collection/:id">
                           <CollectionPage />
                       </Route>
                       <Route path={"/search/:text?"}>
                           <SearchPage />
                       </Route>
                       <Route path="/item/:id">
                           <ItemPage />
                       </Route>
                       {
                           role === "Admin"
                               ?
                               <Route path="/admin">
                                   <AdminPage />
                               </Route>
                               :
                               []
                       }
                       <Redirect to="/" />
                   </Switch>
               </BrowserRouter>) : (<BrowserRouter>
                    <Header isLogged={logged} />
                    <Switch>
                        <Route path="/signUp">
                            <SignUpPage />
                        </Route>
                        <Route path="/item/:id">
                            <ItemPage />
                        </Route>
                        <Route path="/collections/:ownerId">
                            <CollectionsPage />
                        </Route>
                        <Route path={"/search/:text?"}>
                            <SearchPage />
                        </Route>
                        <Route path="/collection/:id">
                            <CollectionPage />
                        </Route>
                        <Route path="/signIn">
                            <SignInPage />
                        </Route>
                        <Route path="/">
                            <HomePage />
                        </Route>
                        <Redirect to="/signUp" />
                    </Switch>
                </BrowserRouter>);
}

export default App;
