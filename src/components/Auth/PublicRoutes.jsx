import React from 'react';
import {isLogin, baseUrl, preserveSearchParams} from "../../utils/constent";
import {Navigate, Outlet, useLocation} from "react-router-dom";

const PublicRoutes = () => {
    const location = useLocation();
    return isLogin() ? <Navigate to={preserveSearchParams(`${baseUrl}/dashboard`, location.search)}/>: <Outlet/> ;
};

export default PublicRoutes;